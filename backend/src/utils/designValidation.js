const ANIME_KEYWORDS = [
  "anime",
  "manga",
  "otaku",
  "chibi",
  "shonen",
  "shojo",
  "isekai",
  "waifu",
  "samurai",
  "mecha",
  "kawaii",
  "cel shading",
  "japanese animation",
  "anime style",
];

const DISALLOWED_KEYWORDS = [
  "nsfw",
  "nude",
  "nudity",
  "explicit",
  "porn",
  "gore",
  "violent",
  "blood",
  "weapon attack",
  "hate",
  "racist",
  "sex",
  "kill",
  "suicide",
  "terror",
  "child sexual",
  "extremist",
];

const COPYRIGHTED_CHARACTER_NAMES = [
  "naruto",
  "goku",
  "luffy",
  "gojo",
  "sukuna",
  "pikachu",
  "sasuke",
  "itachi",
  "tanjiro",
  "nezuko",
  "zoro",
  "vegeta",
  "one piece",
  "dragon ball",
  "jujutsu kaisen",
  "pokemon",
];

export const validateAnimePromptDetailed = (prompt = "") => {
  const normalized = String(prompt).trim().toLowerCase();

  if (!normalized || normalized.length < 8) {
    return { isValid: false, reason: "Prompt is too short" };
  }

  const hasUnsafePrompt = DISALLOWED_KEYWORDS.some((keyword) =>
    normalized.includes(keyword)
  );
  if (hasUnsafePrompt) {
    return { isValid: false, reason: "Unsafe prompt is not allowed" };
  }

  const hasCopyrightedCharacter = COPYRIGHTED_CHARACTER_NAMES.some((name) =>
    normalized.includes(name)
  );
  if (hasCopyrightedCharacter) {
    return { isValid: false, reason: "Copyrighted character names are not allowed" };
  }

  const hasAnimeKeyword = ANIME_KEYWORDS.some((keyword) => normalized.includes(keyword));
  if (!hasAnimeKeyword) {
    return { isValid: false, reason: "Only anime-style prompts are allowed" };
  }

  return { isValid: true, reason: "" };
};

export const validateAnimePrompt = (prompt = "") => {
  return validateAnimePromptDetailed(prompt).isValid;
};
