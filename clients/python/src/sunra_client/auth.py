import os

class MissingCredentialsError(Exception):
    pass


SUNRA_HOST = os.environ.get("SUNRA_HOST", "sunra.ai")


def fetch_credentials() -> str:
    if key := os.getenv("SUNRA_KEY"):
        return key
    else:
        raise MissingCredentialsError(
            "Please set the SUNRA_KEY environment variable to your API key."
        )
