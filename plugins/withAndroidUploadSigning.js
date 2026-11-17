const { withAppBuildGradle } = require('expo/config-plugins');

const SIGNING_MARKER = '// @generated begin ascend upload signing';
const SIGNING_BLOCK = `${SIGNING_MARKER}
def ascendUploadSigning = [
    ASCEND_UPLOAD_KEYSTORE_FILE: System.getenv('ASCEND_UPLOAD_KEYSTORE_FILE')?.trim(),
    ASCEND_UPLOAD_KEYSTORE_PASSWORD: System.getenv('ASCEND_UPLOAD_KEYSTORE_PASSWORD'),
    ASCEND_UPLOAD_KEY_ALIAS: System.getenv('ASCEND_UPLOAD_KEY_ALIAS')?.trim(),
    ASCEND_UPLOAD_KEY_PASSWORD: System.getenv('ASCEND_UPLOAD_KEY_PASSWORD'),
]
def ascendUploadSigningConfigured = ascendUploadSigning.values().any { it?.trim() }
if (ascendUploadSigningConfigured && ascendUploadSigning.values().any { !it?.trim() }) {
    throw new GradleException('Set all four ASCEND_UPLOAD_* signing environment variables to sign a release bundle.')
}
if (ascendUploadSigningConfigured && !file(ascendUploadSigning.ASCEND_UPLOAD_KEYSTORE_FILE).isFile()) {
    throw new GradleException('ASCEND_UPLOAD_KEYSTORE_FILE does not point to a file.')
}

android {
    signingConfigs {
        if (ascendUploadSigningConfigured) {
            ascendUpload {
                storeFile file(ascendUploadSigning.ASCEND_UPLOAD_KEYSTORE_FILE)
                storePassword ascendUploadSigning.ASCEND_UPLOAD_KEYSTORE_PASSWORD
                keyAlias ascendUploadSigning.ASCEND_UPLOAD_KEY_ALIAS
                keyPassword ascendUploadSigning.ASCEND_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            // Never sign a release with the Android debug key.
            signingConfig ascendUploadSigningConfigured ? signingConfigs.ascendUpload : null
        }
    }
}
// @generated end ascend upload signing`;

function withAndroidUploadSigning(config) {
  return withAppBuildGradle(config, (modConfig) => {
    const contents = modConfig.modResults.contents;

    if (!contents.includes(SIGNING_MARKER)) {
      modConfig.modResults.contents = `${contents.trimEnd()}\n\n${SIGNING_BLOCK}\n`;
    }

    return modConfig;
  });
}

module.exports = withAndroidUploadSigning;
