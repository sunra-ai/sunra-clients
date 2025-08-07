plugins {
    kotlin("jvm") version "1.9.25" apply false
    id("eu.kakde.gradle.sonatype-maven-central-publisher") version "1.0.6"
}

catalog {
    versionCatalog {
        from(files("./libs.versions.toml"))
    }
}

// ------------------------------------
// PUBLISHING TO SONATYPE CONFIGURATION
// ------------------------------------
object Meta {
    val COMPONENT_TYPE = "java" // "java" or "versionCatalog"
    val GROUP = "ai.sunra.client"
    val VERSION = "0.2.1" // VERSION OF THE LIBRARY THAT WILL BE PUBLISHED TO REPO.
    val PUBLISHING_TYPE = "AUTOMATIC" // USER_MANAGED or AUTOMATIC
    val DESC = "Sunra Client Library"
    val LICENSE = "Apache-2.0"
    val LICENSE_URL = "https://opensource.org/licenses/Apache-2.0"
    val GITHUB_REPO = "sunra-ai/sunra-clients"
    val DEVELOPER_ID = "sunra"
    val DEVELOPER_NAME = "Sunra AI"
    val DEVELOPER_ORGANIZATION = "sunra.ai"
    val DEVELOPER_ORGANIZATION_URL = "https://sunra.ai"
}

val sonatypeUsername: String? by project // this is defined in ~/.gradle/gradle.properties
val sonatypePassword: String? by project // this is defined in ~/.gradle/gradle.properties

allprojects {
    group = Meta.GROUP
    version = Meta.VERSION
    apply(plugin = "eu.kakde.gradle.sonatype-maven-central-publisher")

    repositories {
        mavenCentral()
        gradlePluginPortal()
    }

    sonatypeCentralPublishExtension {
        groupId.set(Meta.GROUP)
        artifactId.set(project.name)
        // Each subproject will set its own artifactId
        version.set(Meta.VERSION)
        componentType.set(Meta.COMPONENT_TYPE)
        publishingType.set(Meta.PUBLISHING_TYPE)
        username.set(System.getenv("SONATYPE_USERNAME") ?: sonatypeUsername)
        password.set(System.getenv("SONATYPE_PASSWORD") ?: sonatypePassword)

        pom {
            name.set(project.name)
            description.set(Meta.DESC)
            url.set("https://github.com/${Meta.GITHUB_REPO}")
            licenses {
                license {
                    name.set(Meta.LICENSE)
                    url.set(Meta.LICENSE_URL)
                }
            }
            developers {
                developer {
                    id.set(Meta.DEVELOPER_ID)
                    name.set(Meta.DEVELOPER_NAME)
                    organization.set(Meta.DEVELOPER_ORGANIZATION)
                    organizationUrl.set(Meta.DEVELOPER_ORGANIZATION_URL)
                }
            }
            scm {
                url.set("https://github.com/${Meta.GITHUB_REPO}")
                connection.set("scm:git:https://github.com/${Meta.GITHUB_REPO}")
                developerConnection.set("scm:git:https://github.com/${Meta.GITHUB_REPO}")
            }
            issueManagement {
                system.set("GitHub")
                url.set("https://github.com/${Meta.GITHUB_REPO}/issues")
            }
        }
    }
}
