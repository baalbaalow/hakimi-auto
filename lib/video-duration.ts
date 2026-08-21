import "server-only";

const WEBM_TIMECODE_SCALE_ID = [0x2a, 0xd7, 0xb1] as const;
const WEBM_DURATION_ID = [0x44, 0x89] as const;
const DEFAULT_WEBM_TIMECODE_SCALE_NS = 1_000_000;

export function readVideoDurationSeconds(
  bytes: ArrayBuffer,
  mimeType: string,
): number | null {
  if (mimeType === "video/mp4" || mimeType === "video/quicktime") {
    return readIsoMediaDuration(bytes);
  }

  if (mimeType === "video/webm") {
    return readWebmDuration(bytes);
  }

  return null;
}

function readIsoMediaDuration(bytes: ArrayBuffer) {
  const view = new DataView(bytes);
  const movieBox = findIsoBox(view, 0, view.byteLength, "moov");

  if (!movieBox) {
    return null;
  }

  const movieHeader = findIsoBox(
    view,
    movieBox.contentStart,
    movieBox.end,
    "mvhd",
  );

  if (!movieHeader || movieHeader.contentStart + 20 > movieHeader.end) {
    return null;
  }

  const version = view.getUint8(movieHeader.contentStart);
  let timescale: number;
  let duration: number;

  if (version === 0) {
    if (movieHeader.contentStart + 20 > movieHeader.end) {
      return null;
    }

    timescale = view.getUint32(movieHeader.contentStart + 12);
    duration = view.getUint32(movieHeader.contentStart + 16);
  } else if (version === 1) {
    if (movieHeader.contentStart + 32 > movieHeader.end) {
      return null;
    }

    timescale = view.getUint32(movieHeader.contentStart + 20);
    const duration64 = view.getBigUint64(movieHeader.contentStart + 24);

    if (duration64 > BigInt(Number.MAX_SAFE_INTEGER)) {
      return null;
    }

    duration = Number(duration64);
  } else {
    return null;
  }

  return normalizeDuration(duration / timescale);
}

function findIsoBox(
  view: DataView,
  start: number,
  end: number,
  expectedType: string,
) {
  let offset = start;

  while (offset + 8 <= end) {
    const size32 = view.getUint32(offset);
    const type = readAscii(view, offset + 4, 4);
    let headerSize = 8;
    let boxSize = size32;

    if (size32 === 1) {
      if (offset + 16 > end) {
        return null;
      }

      const size64 = view.getBigUint64(offset + 8);

      if (size64 > BigInt(Number.MAX_SAFE_INTEGER)) {
        return null;
      }

      boxSize = Number(size64);
      headerSize = 16;
    } else if (size32 === 0) {
      boxSize = end - offset;
    }

    if (boxSize < headerSize || offset + boxSize > end) {
      return null;
    }

    if (type === expectedType) {
      return {
        contentStart: offset + headerSize,
        end: offset + boxSize,
      };
    }

    offset += boxSize;
  }

  return null;
}

function readWebmDuration(bytes: ArrayBuffer) {
  const view = new DataView(bytes);
  const timecodeScale = readEbmlUnsignedElement(
    view,
    WEBM_TIMECODE_SCALE_ID,
  );
  const duration = readEbmlFloatElement(view, WEBM_DURATION_ID);

  if (duration === null) {
    return null;
  }

  return normalizeDuration(
    (duration * (timecodeScale ?? DEFAULT_WEBM_TIMECODE_SCALE_NS)) /
      1_000_000_000,
  );
}

function readEbmlUnsignedElement(view: DataView, id: readonly number[]) {
  const value = findEbmlElement(view, id);

  if (!value || value.size > 8) {
    return null;
  }

  let result = 0;

  for (let index = 0; index < value.size; index += 1) {
    result = result * 256 + view.getUint8(value.offset + index);
  }

  return Number.isSafeInteger(result) && result > 0 ? result : null;
}

function readEbmlFloatElement(view: DataView, id: readonly number[]) {
  const value = findEbmlElement(view, id);

  if (!value) {
    return null;
  }

  if (value.size === 4) {
    return view.getFloat32(value.offset);
  }

  if (value.size === 8) {
    return view.getFloat64(value.offset);
  }

  return null;
}

function findEbmlElement(view: DataView, id: readonly number[]) {
  for (let offset = 0; offset <= view.byteLength - id.length - 1; offset += 1) {
    if (!matchesBytes(view, offset, id)) {
      continue;
    }

    const size = readEbmlVint(view, offset + id.length);

    if (
      size &&
      size.value >= 0 &&
      size.value <= view.byteLength - size.nextOffset
    ) {
      return {
        offset: size.nextOffset,
        size: size.value,
      };
    }
  }

  return null;
}

function readEbmlVint(view: DataView, offset: number) {
  if (offset >= view.byteLength) {
    return null;
  }

  const firstByte = view.getUint8(offset);
  let mask = 0x80;
  let length = 1;

  while (length <= 8 && (firstByte & mask) === 0) {
    mask >>= 1;
    length += 1;
  }

  if (length > 8 || offset + length > view.byteLength) {
    return null;
  }

  let value = firstByte & (mask - 1);

  for (let index = 1; index < length; index += 1) {
    value = value * 256 + view.getUint8(offset + index);
  }

  if (!Number.isSafeInteger(value)) {
    return null;
  }

  return {
    value,
    nextOffset: offset + length,
  };
}

function matchesBytes(
  view: DataView,
  offset: number,
  expected: readonly number[],
) {
  return expected.every(
    (byte, index) => view.getUint8(offset + index) === byte,
  );
}

function readAscii(view: DataView, offset: number, length: number) {
  let value = "";

  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(view.getUint8(offset + index));
  }

  return value;
}

function normalizeDuration(value: number) {
  return Number.isFinite(value) && value > 0 ? value : null;
}
