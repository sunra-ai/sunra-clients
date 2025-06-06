package ai.sunra.client;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

/**
 * The JSON input.
 */
public class JsonInput {

    /**
     * The input.
     */
    private final JsonObject input;

    /**
     * Create a new JSON input.
     *
     * @param input The input.
     */
    JsonInput(JsonObject input) {
        this.input = input;
    }

    /**
     * Create a new JSON input.
     *
     * @return The JSON input.
     */
    public static JsonInput input() {
        return new JsonInput(new JsonObject());
    }

    /**
     * Set a property in the input.
     *
     * @param key The key.
     * @param value The value.
     * @return The JSON input.
     */
    public JsonInput set(String key, String value) {
        input.addProperty(key, value);
        return this;
    }

    /**
     * Set a property in the input.
     *
     * @param key The key.
     * @param value The value.
     * @return The JSON input.
     */
    public JsonInput set(String key, Number value) {
        input.addProperty(key, value);
        return this;
    }

    /**
     * Set a property in the input.
     *
     * @param key The key.
     * @param value The value.
     * @return The JSON input.
     */
    public JsonInput set(String key, Boolean value) {
        input.addProperty(key, value);
        return this;
    }

    /**
     * Set a property in the input.
     *
     * @param key The key.
     * @param value The value.
     * @return The JSON input.
     */
    public JsonInput set(String key, Character value) {
        input.addProperty(key, value);
        return this;
    }

    /**
     * Set a property in the input.
     *
     * @param key The key.
     * @param value The value.
     * @return The JSON input.
     */
    public JsonInput set(String key, JsonObject value) {
        input.add(key, value);
        return this;
    }

    /**
     * Set a property in the input.
     *
     * @param key The key.
     * @param value The value.
     * @return The JSON input.
     */
    public JsonInput set(String key, JsonArray value) {
        input.add(key, value);
        return this;
    }

    /**
     * Build the JSON input.
     *
     * @return The JSON input.
     */
    public JsonObject build() {
        return input;
    }
}
