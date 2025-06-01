plugins {
    kotlin("jvm")
    id("org.jetbrains.dokka") version "1.9.20"
}

repositories {
    mavenCentral()
}

java {
    withSourcesJar()
}

tasks.withType<JavaCompile> {
    sourceCompatibility = JavaVersion.VERSION_11.toString()
    targetCompatibility = JavaVersion.VERSION_11.toString()
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    kotlinOptions {
        jvmTarget = "11"
    }
}

tasks.test {
    useJUnitPlatform()
}

dependencies {
    api(project(":sunra-client-async"))
    implementation(kotlin("stdlib"))
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")
}

afterEvaluate {
    when {
        plugins.hasPlugin("org.jetbrains.kotlin.jvm") -> {
            tasks.named<org.jetbrains.dokka.gradle.DokkaTask>("dokkaHtml") {
                doLast {
                    copy {
                        from(outputDirectory)
                        into(rootProject.projectDir.resolve("docs/${project.name}"))
                    }
                }
            }
        }
    }
}
