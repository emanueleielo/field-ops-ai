"""SMS service for sending messages via Twilio."""

import logging
import unicodedata

from twilio.rest import Client

from app.config import get_settings

logger = logging.getLogger(__name__)

# GSM-7 basic character set (standard SMS encoding)
# Reference: https://en.wikipedia.org/wiki/GSM_03.38
GSM7_BASIC_CHARS = (
    "@"
    "\u00a3"  # Pound sign
    "$"
    "\u00a5"  # Yen sign
    "\u00e8"  # e grave
    "\u00e9"  # e acute
    "\u00f9"  # u grave
    "\u00ec"  # i grave
    "\u00f2"  # o grave
    "\u00c7"  # C cedilla
    "\n"
    "\u00d8"  # O stroke
    "\u00f8"  # o stroke
    "\r"
    "\u00c5"  # A ring
    "\u00e5"  # a ring
    "\u0394"  # Greek Delta
    "_"
    "\u03a6"  # Greek Phi
    "\u0393"  # Greek Gamma
    "\u039b"  # Greek Lambda
    "\u03a9"  # Greek Omega
    "\u03a0"  # Greek Pi
    "\u03a8"  # Greek Psi
    "\u03a3"  # Greek Sigma
    "\u0398"  # Greek Theta
    "\u039e"  # Greek Xi
    "\x1b"  # Escape for extended set
    "\u00c6"  # AE ligature
    "\u00e6"  # ae ligature
    "\u00df"  # German sharp s
    "\u00c9"  # E acute
    " "
    "!"
    '"'
    "#"
    "\u00a4"  # Currency sign
    "%"
    "&"
    "'"
    "("
    ")"
    "*"
    "+"
    ","
    "-"
    "."
    "/"
    "0123456789"
    ":"
    ";"
    "<"
    "="
    ">"
    "?"
    "\u00a1"  # Inverted exclamation
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "\u00c4"  # A umlaut
    "\u00d6"  # O umlaut
    "\u00d1"  # N tilde
    "\u00dc"  # U umlaut
    "\u00a7"  # Section sign
    "\u00bf"  # Inverted question mark
    "abcdefghijklmnopqrstuvwxyz"
    "\u00e4"  # a umlaut
    "\u00f6"  # o umlaut
    "\u00f1"  # n tilde
    "\u00fc"  # u umlaut
    "\u00e0"  # a grave
)

# GSM-7 extended character set (counts as 2 characters)
GSM7_EXTENDED_CHARS = "^{}\\[~]|\u20ac"  # Includes Euro sign

# Combined set for checking
GSM7_ALL_CHARS = set(GSM7_BASIC_CHARS + GSM7_EXTENDED_CHARS)

# Maximum characters for single SMS (GSM-7)
SMS_MAX_LENGTH = 160

# Maximum characters for concatenated SMS segment
SMS_CONCAT_MAX_LENGTH = 153  # 7 chars reserved for UDH header


# Common character replacements for non-GSM-7 characters
CHAR_REPLACEMENTS: dict[str, str] = {
    # Smart quotes
    "\u2018": "'",  # Left single quote
    "\u2019": "'",  # Right single quote
    "\u201c": '"',  # Left double quote
    "\u201d": '"',  # Right double quote
    "\u201a": ",",  # Single low quote
    "\u201e": '"',  # Double low quote
    # Dashes
    "\u2013": "-",  # En dash
    "\u2014": "-",  # Em dash
    "\u2015": "-",  # Horizontal bar
    # Ellipsis
    "\u2026": "...",  # Horizontal ellipsis
    # Spaces
    "\u00a0": " ",  # Non-breaking space
    "\u2002": " ",  # En space
    "\u2003": " ",  # Em space
    "\u2009": " ",  # Thin space
    "\u200a": " ",  # Hair space
    # Bullets
    "\u2022": "-",  # Bullet
    "\u2023": "-",  # Triangular bullet
    "\u2043": "-",  # Hyphen bullet
    # Other common
    "\u00b0": "o",  # Degree sign -> 'o'
    "\u00b2": "2",  # Superscript 2
    "\u00b3": "3",  # Superscript 3
    "\u00b9": "1",  # Superscript 1
    "\u00bd": "1/2",  # Vulgar fraction 1/2
    "\u00bc": "1/4",  # Vulgar fraction 1/4
    "\u00be": "3/4",  # Vulgar fraction 3/4
    "\u00d7": "x",  # Multiplication sign
    "\u00f7": "/",  # Division sign
    "\u2212": "-",  # Minus sign
    "\u00ae": "(R)",  # Registered trademark
    "\u2122": "(TM)",  # Trademark
    "\u00a9": "(C)",  # Copyright
    # Accented characters not in GSM-7
    "\u00e1": "a",  # a acute
    "\u00ed": "i",  # i acute
    "\u00f3": "o",  # o acute
    "\u00fa": "u",  # u acute
    "\u00fd": "y",  # y acute
    "\u00c1": "A",  # A acute
    "\u00cd": "I",  # I acute
    "\u00d3": "O",  # O acute
    "\u00da": "U",  # U acute
    "\u00dd": "Y",  # Y acute
    "\u00e2": "a",  # a circumflex
    "\u00ea": "e",  # e circumflex
    "\u00ee": "i",  # i circumflex
    "\u00f4": "o",  # o circumflex
    "\u00fb": "u",  # u circumflex
    "\u00c2": "A",  # A circumflex
    "\u00ca": "E",  # E circumflex
    "\u00ce": "I",  # I circumflex
    "\u00d4": "O",  # O circumflex
    "\u00db": "U",  # U circumflex
    "\u00eb": "e",  # e umlaut
    "\u00ef": "i",  # i umlaut
    "\u00ff": "y",  # y umlaut
    "\u00cb": "E",  # E umlaut
    "\u00cf": "I",  # I umlaut
    "\u0178": "Y",  # Y umlaut
    "\u00e3": "a",  # a tilde
    "\u00f5": "o",  # o tilde
    "\u00c3": "A",  # A tilde
    "\u00d5": "O",  # O tilde
    "\u010d": "c",  # c caron
    "\u0161": "s",  # s caron
    "\u017e": "z",  # z caron
    "\u010c": "C",  # C caron
    "\u0160": "S",  # S caron
    "\u017d": "Z",  # Z caron
}


class SMSServiceError(Exception):
    """Exception raised for SMS service errors."""


class SMSService:
    """Service for sending SMS messages via Twilio."""

    def __init__(self) -> None:
        """Initialize the SMS service with Twilio client."""
        settings = get_settings()

        if not settings.twilio_account_sid or not settings.twilio_auth_token:
            raise SMSServiceError("Twilio credentials not configured")

        self._client = Client(
            settings.twilio_account_sid,
            settings.twilio_auth_token,
        )
        self._from_number = settings.twilio_phone_number

    def sanitize_to_gsm7(self, text: str) -> str:
        """Convert text to GSM-7 compatible characters.

        Replaces common non-GSM-7 characters with GSM-7 equivalents
        and removes characters that cannot be represented.

        Args:
            text: The text to sanitize.

        Returns:
            GSM-7 compatible text.
        """
        if not text:
            return ""

        # First, normalize unicode (e.g., decompose accents)
        normalized = unicodedata.normalize("NFKC", text)

        result: list[str] = []
        for char in normalized:
            if char in GSM7_ALL_CHARS:
                result.append(char)
            elif char in CHAR_REPLACEMENTS:
                result.append(CHAR_REPLACEMENTS[char])
            else:
                # Try to find ASCII equivalent via NFKD decomposition
                decomposed = unicodedata.normalize("NFKD", char)
                ascii_char = decomposed.encode("ascii", "ignore").decode("ascii")
                if ascii_char and all(c in GSM7_ALL_CHARS for c in ascii_char):
                    result.append(ascii_char)
                # If no equivalent found, skip the character

        return "".join(result)

    def _count_gsm7_length(self, text: str) -> int:
        """Count the GSM-7 character length of text.

        Extended characters count as 2 characters.

        Args:
            text: The text to count.

        Returns:
            GSM-7 character length.
        """
        length = 0
        for char in text:
            if char in GSM7_EXTENDED_CHARS:
                length += 2  # Extended chars use escape sequence
            else:
                length += 1
        return length

    def _split_long_word(
        self,
        word: str,
        segment_max: int,
        current_segment: str,
        current_length: int,
        segments: list[str],
    ) -> tuple[str, int]:
        """Split a word that is longer than the segment max.

        Args:
            word: The word to split.
            segment_max: Maximum segment length.
            current_segment: Current segment being built.
            current_length: Current segment length.
            segments: List of segments to append to.

        Returns:
            Tuple of (updated current_segment, updated current_length).
        """
        for char in word:
            char_len = 2 if char in GSM7_EXTENDED_CHARS else 1
            if current_length + char_len > segment_max:
                if current_segment:
                    segments.append(current_segment)
                current_segment = char
                current_length = char_len
            else:
                current_segment += char
                current_length += char_len
        return current_segment, current_length

    def split_message(
        self,
        text: str,
        max_length: int = SMS_MAX_LENGTH,
    ) -> list[str]:
        """Split a message into SMS-sized chunks.

        Splits on word boundaries when possible. For concatenated SMS,
        each segment is limited to 153 characters (7 chars for UDH).

        Args:
            text: The text to split.
            max_length: Maximum length per segment (default 160).

        Returns:
            List of message segments.
        """
        if not text:
            return []

        # Sanitize the text first
        text = self.sanitize_to_gsm7(text)

        # Check if message fits in single SMS
        total_length = self._count_gsm7_length(text)
        if total_length <= max_length:
            return [text]

        # For concatenated SMS, use shorter segments
        segment_max = min(max_length, SMS_CONCAT_MAX_LENGTH)
        segments: list[str] = []
        current_segment = ""
        current_length = 0

        words = text.split(" ")
        for word in words:
            word_length = self._count_gsm7_length(word)

            # If adding word would exceed limit
            space_needed = 1 if current_segment else 0
            if current_length + word_length + space_needed > segment_max:
                if current_segment:
                    segments.append(current_segment)
                    current_segment = ""
                    current_length = 0

                # Handle words longer than segment_max
                if word_length > segment_max:
                    current_segment, current_length = self._split_long_word(
                        word, segment_max, current_segment, current_length, segments
                    )
                    continue

            # Add word to current segment
            if current_segment:
                current_segment += " " + word
                current_length += 1 + word_length
            else:
                current_segment = word
                current_length = word_length

        # Add remaining segment
        if current_segment:
            segments.append(current_segment)

        return segments

    async def send_sms(
        self,
        to: str,
        body: str,
    ) -> list[str]:
        """Send an SMS message, splitting into multiple if needed.

        Args:
            to: The recipient phone number (E.164 format).
            body: The message body.

        Returns:
            List of Twilio message SIDs for each sent segment.

        Raises:
            SMSServiceError: If sending fails.
        """
        if not self._from_number:
            raise SMSServiceError("Twilio phone number not configured")

        # Split message if needed
        segments = self.split_message(body)

        if not segments:
            logger.warning("Attempted to send empty SMS to %s", to)
            return []

        message_sids: list[str] = []

        for i, segment in enumerate(segments):
            try:
                # Add segment indicator if multi-part
                send_body = segment
                if len(segments) > 1:
                    indicator = f"({i + 1}/{len(segments)}) "
                    # Recalculate segment to fit indicator
                    available_length = SMS_CONCAT_MAX_LENGTH - len(indicator)
                    if self._count_gsm7_length(segment) > available_length:
                        send_body = indicator + segment[:available_length]
                    else:
                        send_body = indicator + segment

                message = self._client.messages.create(
                    to=to,
                    from_=self._from_number,
                    body=send_body,
                )

                message_sids.append(message.sid)
                logger.info(
                    "Sent SMS to %s (segment %d/%d, SID: %s)",
                    to,
                    i + 1,
                    len(segments),
                    message.sid,
                )

            except Exception as e:
                logger.exception("Failed to send SMS to %s: %s", to, e)
                raise SMSServiceError(f"Failed to send SMS: {e}") from e

        return message_sids


class SMSServiceSingleton:
    """Singleton container for SMSService instance."""

    _instance: SMSService | None = None

    @classmethod
    def get_instance(cls) -> SMSService:
        """Get or create the SMS service singleton instance.

        Returns:
            The SMS service singleton.

        Raises:
            SMSServiceError: If Twilio is not configured.
        """
        if cls._instance is None:
            cls._instance = SMSService()
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        """Reset the singleton instance (for testing)."""
        cls._instance = None


def get_sms_service() -> SMSService:
    """Get the SMS service instance.

    Returns:
        The SMS service singleton.

    Raises:
        SMSServiceError: If Twilio is not configured.
    """
    return SMSServiceSingleton.get_instance()
