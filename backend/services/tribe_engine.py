# Optional GPU path — falls back to Claude API if unavailable
# Requires: pip install tribev2 torch

TRIBE_AVAILABLE = False

try:
    # from tribev2 import TribeModel
    # tribe_model = TribeModel.from_pretrained("facebook/tribev2")
    # TRIBE_AVAILABLE = True
    pass
except ImportError:
    pass

async def analyze_with_tribe(content: str):
    if not TRIBE_AVAILABLE:
        raise RuntimeError("TRIBE v2 not available — use Claude API analyzer instead")
    # Implementation when GPU available
    pass
