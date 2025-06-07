import { getRestApiUrl, RequiredConfig } from './config'
import { dispatchRequest } from './request'
import { isPlainObject } from './utils'
/**
 * File support for the client. This interface establishes the contract for
 * uploading files to the server and transforming the input to replace file
 * objects with URLs.
 */
export interface StorageClient {
  /**
   * Upload a file to the server. Returns the URL of the uploaded file.
   * @param file the file to upload
   * @param options optional parameters, such as custom file name
   * @returns the URL of the uploaded file
   */
  upload: (file: Blob) => Promise<string>;

  /**
   * Transform the input to replace file objects with URLs. This is used
   * to transform the input before sending it to the server and ensures
   * that the server receives URLs instead of file objects.
   *
   * @param input the input to transform.
   * @returns the transformed input.
   */

  transformInput: (input: Record<string, any>) => Promise<Record<string, any>>;
}

type InitiateUploadResult = {
  file_url: string;
  upload_url: string;
};

type InitiateUploadData = {
  file_name: string;
  content_type: string | null;
};

/**
 * Get the file extension from the content type. This is used to generate
 * a file name if the file name is not provided.
 *
 * @param contentType the content type of the file.
 * @returns the file extension or `bin` if the content type is not recognized.
 */
function getExtensionFromContentType(contentType: string): string {
  const [, fileType] = contentType.split('/')
  return fileType?.split(/[-;]/)[0] ?? 'bin'
}

/**
 * Initiate the upload of a file to the server. This returns the URL to upload
 * the file to and the URL of the file once it is uploaded.
 */
async function initiateUpload(
  file: Blob,
  config: RequiredConfig,
  contentType: string,
): Promise<InitiateUploadResult> {
  const filename =
    (file as File).name || `${Date.now()}.${getExtensionFromContentType(contentType)}`

  return await dispatchRequest<InitiateUploadData, InitiateUploadResult>({
    method: 'POST',
    targetUrl: `${getRestApiUrl()}/storage/upload/initiate`,
    input: {
      content_type: contentType,
      file_name: filename,
    },
    config,
  })
}

type KeyValuePair = [string, any];

type StorageClientDependencies = {
  config: RequiredConfig;
};

export function createStorageClient({
  config,
}: StorageClientDependencies): StorageClient {
  const ref: StorageClient = {
    upload: async (file: Blob) => {
      const contentType = file.type || 'application/octet-stream'

      const { axios } = config
      const { upload_url: uploadUrl, file_url: url } = await initiateUpload(
        file,
        config,
        contentType,
      )
      await axios.put(uploadUrl, file)
      return url
    },


    transformInput: async (input: any): Promise<any> => {
      if (Array.isArray(input)) {
        return Promise.all(input.map((item) => ref.transformInput(item)))
      } else if (input instanceof Blob) {
        return await ref.upload(input)
      } else if (typeof input === 'string' && input.startsWith('blob:')) {
        const blob = await fetch(input).then(r => r.blob())
        return await ref.upload(blob)
      } else if (isPlainObject(input)) {
        const inputObject = input as Record<string, any>
        const promises = Object.entries(inputObject).map(
          async ([key, value]): Promise<KeyValuePair> => {
            return [key, await ref.transformInput(value)]
          },
        )
        const results = await Promise.all(promises)
        return Object.fromEntries(results)
      }
      // Return the input as is if it's neither an object nor a file/blob/data URI
      return input
    },
  }
  return ref
}
