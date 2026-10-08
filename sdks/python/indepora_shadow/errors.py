class IndeporaError(RuntimeError):
    """Base class for expected Indepora client failures."""


class IndeporaTransportError(IndeporaError):
    """The Stemcheck endpoint could not be reached."""


class IndeporaAPIError(IndeporaError):
    """Stemcheck returned a non-success HTTP status."""

    def __init__(self, status_code: int) -> None:
        self.status_code = status_code
        super().__init__(f"Stemcheck returned HTTP {status_code}.")


class IndeporaResponseError(IndeporaError):
    """Stemcheck returned an invalid or unexpected response."""
