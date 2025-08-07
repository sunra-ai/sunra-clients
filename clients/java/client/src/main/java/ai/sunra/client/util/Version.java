package ai.sunra.client.util;

import ai.sunra.client.exception.SunraException;
import java.io.InputStream;
import java.util.Properties;

public final class Version {
    private static final String VERSION = readVersion();

    private Version() {}

    public static String get() {
        return VERSION;
    }

    private static String readVersion() {
        try (InputStream input = Version.class.getResourceAsStream("/version.properties")) {
            if (input == null) {
                return "sunra-client/java";
            }
            Properties prop = new Properties();
            prop.load(input);
            return prop.getProperty("version", "sunra-client/java");
        } catch (Exception e) {
            return "sunra-client/java";
        }
    }
}

