import org.gradle.api.publish.PublishingExtension
import org.gradle.api.publish.maven.MavenPublication
import org.gradle.plugins.signing.SigningExtension

plugins {
    id("com.diffplug.spotless") version "6.25.0"
    id("io.github.gradle-nexus.publish-plugin") version "2.0.0"
    kotlin("jvm") version "1.9.25" apply false
}

subprojects {
    group = "ai.sunra.client"
    version = "0.1.0"

    apply(plugin = "com.diffplug.spotless")
    apply(plugin = "maven-publish")
    apply(plugin = "signing")

    spotless {
        java {
            palantirJavaFormat()
        }
        kotlin {
            ktlint()
        }
        kotlinGradle {
            target("*.gradle.kts")
            ktlint()
        }
    }

    configure<PublishingExtension> {
        publications {
            create<MavenPublication>("mavenJava") {
                // from(components["java"])
                pom {
                    name.set("sunra Client Library")
                    description.set("A Client library for sunra.ai APIs")
                    inceptionYear.set("2024")
                    url.set("https://github.com/sunra-ai/sunra-clients/tree/main/clients/java")
                    licenses {
                        license {
                            name.set("Apache License 2.0")
                            url.set("https://www.apache.org/licenses/LICENSE-2.0")
                        }
                    }
                    developers {
                        developer {
                            id.set("sunra")
                            name.set("sunra AI")
                            email.set("developers@sunra.ai")
                            url.set("https://github.com/sunra-ai")
                        }
                    }
                    scm {
                        url.set("https://github.com/sunra-ai/sunra-clients/tree/main/clients/java")
                        connection.set("scm:git:git://github.com/sunra-ai/sunra-clients.git")
                    }
                }
            }
        }
    }

    configure<SigningExtension> {
        val publishing = extensions.getByName("publishing") as PublishingExtension
        sign(publishing.publications["mavenJava"])
    }

    tasks.withType<Javadoc> {
        // Disable empty javadoc warnings
        (options as CoreJavadocOptions).addBooleanOption("Xdoclint:none", true)
    }

    afterEvaluate {
        when {
            plugins.hasPlugin("java") && !plugins.hasPlugin("org.jetbrains.kotlin.jvm") -> {
                tasks.named<Javadoc>("javadoc") {
                    options.encoding = "UTF-8"

                    doLast {
                        copy {
                            from(destinationDir)
                            into(rootProject.projectDir.resolve("docs/${project.name}"))
                        }
                    }
                }
            }
        }
    }
}

nexusPublishing {
    repositories {
        sonatype {
            nexusUrl.set(uri("https://s01.oss.sonatype.org/service/local/"))
            snapshotRepositoryUrl.set(uri("https://s01.oss.sonatype.org/content/repositories/snapshots/"))
        }
    }
}
