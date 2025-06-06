package ai.sunra.client;

public interface ApiOptions<O> {

    /*
     * The input for the API call.
     */
    Object getInput();

    /*
     * The HTTP method to use for the API call.
     */
    String getHttpMethod();

    /*
     * The type of the result of the API call.
     */
    Class<O> getResultType();
}
