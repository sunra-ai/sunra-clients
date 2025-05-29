package ai.sunra.client;

public interface ApiOptions<O> {

    Object getInput();

    String getHttpMethod();

    Class<O> getResultType();
}
