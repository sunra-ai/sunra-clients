/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

// get your API key from https://sunra.ai/dashboard/api-tokens
// sunra client reads the credentials from the environment variable SUNRA_KEY by default

import { createSunraClient } from '@sunra/client'
import * as sunraProxy from '@sunra/server-proxy/express'
import cors from 'cors'
import { configDotenv } from 'dotenv'
import express from 'express'
import * as path from 'path'
import multer from 'multer'
import fs from 'fs/promises'
import { Blob } from 'buffer'

const sunra = createSunraClient({
  credentials: process.env.SUNRA_KEY,
})

const upload = multer({ dest: 'uploads/' })

configDotenv({ path: './env.local' })

const app = express()

// Middlewares
app.use('/assets', express.static(path.join(__dirname, 'assets')))
app.use(express.json())

// sunra client proxy
app.all(sunraProxy.route, cors(), sunraProxy.handler)

// Your API endpoints
app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to demo-express-app!' })
})

app.get('/sunra-on-server', async (req, res) => {
  // find more models here: https://sunra.ai/models
  const result = await sunra.subscribe('black-forest-labs/flux-kontext-pro/text-to-image', {
    input: {
      prompt:
        'a black cat with glowing eyes, cute, adorable, disney, pixar, highly detailed, 8k',
    },
  })
  res.send(result)
})

app.post('/sunra-upload-demo', upload.single('file'), async (req, res) => {
  const file: any = (req as any).file

  // read from req.file.path
  const buffer = await fs.readFile(file.path)
  const blob = new Blob([buffer], { type: file.mimetype })

  // find more models here: https://sunra.ai/models
  // TODO: change the default model id
  const result = await sunra.subscribe('black-forest-labs/flux-kontext-pro/image-to-image', {
    input: {
      prompt:
        'a black cat with glowing eyes, cute, adorable, disney, pixar, highly detailed, 8k',
      image: blob
    },
  })
  res.send(result)
})

const port = process.env.PORT || 3333
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`)
})
server.on('error', console.error)
