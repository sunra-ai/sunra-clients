package ai.sunra.client.util;

import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import java.util.Arrays;
import java.util.List;

/**
 * The endpoint ID.
 */
public class EndpointId {

    /**
     * The reserved namespaces.
     */
    private static final List<String> RESERVED_NAMESPACES = Arrays.asList("workflows", "comfy");

    /**
     * The app owner.
     */
    private final String appOwner;

    /**
     * The app name.
     */
    private final String appName;

    /**
     * The path.
     */
    private final String path;

    /**
     * The namespace.
     */
    private final String namespace;

    /**
     * Create a new endpoint ID.
     * @param appOwner
     * @param appName
     * @param path
     * @param namespace
     */
    public EndpointId(
            @Nonnull String appOwner, @Nonnull String appName, @Nullable String path, @Nullable String namespace) {
        this.appOwner = appOwner;
        this.appName = appName;
        this.path = path;
        this.namespace = namespace;
    }

    /**
     * Get the app owner.
     * @return
     */
    @Nonnull
    public String getAppOwner() {
        return appOwner;
    }

    /**
     * Get the app name.
     * @return
     */
    @Nonnull
    public String getAppName() {
        return appName;
    }

    /**
     * Get the path.
     * @return
     */
    @Nullable
    public String getPath() {
        return path;
    }

    /**
     * Get the namespace.
     * @return
     */
    @Nullable
    public String getNamespace() {
        return namespace;
    }

    /**
     * Create a new endpoint ID from a string.
     * @param endpointId
     * @return
     */
    public static EndpointId fromString(String endpointId) {
        final String[] parts = endpointId.split("/");

        if (RESERVED_NAMESPACES.contains(parts[0])) {
            return new EndpointId(
                    parts[1],
                    parts[2],
                    parts.length > 3 ? String.join("/", Arrays.copyOfRange(parts, 3, parts.length)) : null,
                    parts[0]);
        }

        return new EndpointId(
                parts[0],
                parts[1],
                parts.length > 2 ? String.join("/", Arrays.copyOfRange(parts, 2, parts.length)) : null,
                null);
    }
}
