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

    console.log(`Syncing Python version to ${newVersion}`);

    // Read pyproject.toml
    const pyprojectPath = 'pyproject.toml';
    if (!fs.existsSync(pyprojectPath)) {
        throw new Error(`${pyprojectPath} not found`);
    }

    let pyprojectContent = fs.readFileSync(pyprojectPath, 'utf8');

    // Update version in pyproject.toml
    // Matches: version = "0.2.1"
    const versionRegex = /^version\s*=\s*"[^"]*"/m;

    if (!versionRegex.test(pyprojectContent)) {
        throw new Error('Version field not found in pyproject.toml');
    }

    pyprojectContent = pyprojectContent.replace(versionRegex, `version = "${newVersion}"`);

    // Write back to pyproject.toml
    fs.writeFileSync(pyprojectPath, pyprojectContent, 'utf8');

    console.log(`✅ Updated pyproject.toml version to ${newVersion}`);
} catch (error) {
    console.error(`❌ Error syncing Python version: ${error.message}`);
    process.exit(1);
}
