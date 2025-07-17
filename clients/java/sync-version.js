#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

try {
    // Read version from package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const newVersion = packageJson.version;

    if (!newVersion) {
        throw new Error('No version found in package.json');
    }

    console.log(`Syncing Java version to ${newVersion}`);

    // Read build.gradle.kts
    const buildGradlePath = 'build.gradle.kts';
    if (!fs.existsSync(buildGradlePath)) {
        throw new Error(`${buildGradlePath} not found`);
    }

    let buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');

    // Update version in build.gradle.kts
    // Matches: val VERSION = "0.1.8" // VERSION OF THE LIBRARY THAT WILL BE PUBLISHED TO REPO.
    const versionRegex = /val VERSION = "[^"]*"/;

    if (!versionRegex.test(buildGradleContent)) {
        throw new Error('VERSION field not found in build.gradle.kts');
    }

    buildGradleContent = buildGradleContent.replace(versionRegex, `val VERSION = "${newVersion}"`);

    // Write back to build.gradle.kts
    fs.writeFileSync(buildGradlePath, buildGradleContent, 'utf8');

    console.log(`✅ Updated build.gradle.kts version to ${newVersion}`);
} catch (error) {
    console.error(`❌ Error syncing Java version: ${error.message}`);
    process.exit(1);
}
