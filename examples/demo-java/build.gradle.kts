plugins {
    java
    application
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("ai.sunra.client:sunra-client:0.1.0")
}

application {
    mainClass.set("SunraDemo")
}

sourceSets {
    main {
        java {
            srcDirs(".")
        }
    }
}

tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
    sourceCompatibility = "11"
    targetCompatibility = "11"
}
