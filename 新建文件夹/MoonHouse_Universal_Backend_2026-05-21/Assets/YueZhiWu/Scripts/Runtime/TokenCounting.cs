using System;
using System.Collections.Generic;
using System.Globalization;

namespace Mingyue.YueZhiWu
{
    public interface ITokenCounter
    {
        string TokenizerKey { get; }
        string TokenizerName { get; }
        int CountText(string text);
        int CountMessage(string role, string content, string name = "");
        int CountRequestOverhead();
    }

    public sealed class HeuristicTokenCounter : ITokenCounter
    {
        public const float DefaultCharactersPerToken = 3.35f;

        private readonly float charactersPerToken;

        public string TokenizerKey => "heuristic";
        public string TokenizerName => "heuristic/characters-per-token";

        public HeuristicTokenCounter(float charactersPerToken = DefaultCharactersPerToken)
        {
            this.charactersPerToken = Math.Max(1f, charactersPerToken);
        }

        public int CountText(string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return 0;
            }

            return Math.Max(1, (int)Math.Ceiling(text.Length / charactersPerToken));
        }

        public int CountMessage(string role, string content, string name = "")
        {
            int tokens = CountText(content);
            if (!string.IsNullOrWhiteSpace(role))
            {
                tokens += CountText(role);
            }

            if (!string.IsNullOrWhiteSpace(name))
            {
                tokens += CountText(name);
            }

            return tokens + 2;
        }

        public int CountRequestOverhead()
        {
            return 0;
        }
    }

    public sealed class HybridTokenCounter : ITokenCounter
    {
        private readonly TokenizerProfile profile;

        public string TokenizerKey => profile.key;
        public string TokenizerName => profile.label;

        public HybridTokenCounter(float multiplier = 1f)
            : this(TokenizerProfile.Create(
                "hybrid",
                "hybrid/generic",
                4.0,
                1.0,
                1.0,
                1.0,
                2.0,
                multiplier,
                2,
                1,
                0))
        {
        }

        internal HybridTokenCounter(TokenizerProfile profile)
        {
            this.profile = profile ?? TokenizerProfile.CreateFallback();
        }

        public int CountText(string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return 0;
            }

            double tokens = 0;
            int asciiRun = 0;

            for (int i = 0; i < text.Length; i += 1)
            {
                char ch = text[i];

                if (char.IsHighSurrogate(ch))
                {
                    FlushAsciiRun(ref tokens, ref asciiRun);
                    int codePoint = i + 1 < text.Length && char.IsLowSurrogate(text[i + 1])
                        ? char.ConvertToUtf32(ch, text[i + 1])
                        : ch;
                    tokens += IsCjkCodePoint(codePoint) ? profile.cjkWeight : profile.emojiWeight;
                    if (codePoint > char.MaxValue)
                    {
                        i += 1;
                    }

                    continue;
                }

                if (IsAsciiWordCharacter(ch))
                {
                    asciiRun += 1;
                    continue;
                }

                FlushAsciiRun(ref tokens, ref asciiRun);

                if (char.IsWhiteSpace(ch))
                {
                    if (ch == '\n' || ch == '\r')
                    {
                        tokens += 1;
                    }
                    else if (ch == '\t')
                    {
                        tokens += 0.5;
                    }

                    continue;
                }

                if (IsCjkCodePoint(ch))
                {
                    tokens += profile.cjkWeight;
                    continue;
                }

                UnicodeCategory category = char.GetUnicodeCategory(ch);
                if (IsPunctuation(category))
                {
                    tokens += profile.punctuationWeight;
                    continue;
                }

                if (IsSymbol(category))
                {
                    tokens += profile.symbolWeight;
                    continue;
                }

                tokens += 1;
            }

            FlushAsciiRun(ref tokens, ref asciiRun);
            return Math.Max(1, (int)Math.Ceiling(tokens * profile.multiplier));
        }

        public int CountMessage(string role, string content, string name = "")
        {
            int tokens = profile.tokensPerMessage + CountText(content);
            if (!string.IsNullOrWhiteSpace(role))
            {
                tokens += CountText(role);
            }

            if (!string.IsNullOrWhiteSpace(name))
            {
                tokens += CountText(name) + profile.tokensPerName;
            }

            return Math.Max(0, tokens);
        }

        public int CountRequestOverhead()
        {
            return Math.Max(0, profile.requestPaddingTokens);
        }

        private void FlushAsciiRun(ref double tokens, ref int asciiRun)
        {
            if (asciiRun <= 0)
            {
                return;
            }

            tokens += Math.Max(1, Math.Ceiling(asciiRun / profile.asciiCharsPerToken));
            asciiRun = 0;
        }

        private static bool IsAsciiWordCharacter(char ch)
        {
            return ch <= 127 &&
                   (char.IsLetterOrDigit(ch) ||
                    ch == '_' ||
                    ch == '-' ||
                    ch == '\'');
        }

        private static bool IsCjkCodePoint(int codePoint)
        {
            return (codePoint >= 0x3400 && codePoint <= 0x4DBF) ||
                   (codePoint >= 0x4E00 && codePoint <= 0x9FFF) ||
                   (codePoint >= 0xF900 && codePoint <= 0xFAFF) ||
                   (codePoint >= 0x20000 && codePoint <= 0x2FA1F) ||
                   (codePoint >= 0x3040 && codePoint <= 0x30FF) ||
                   (codePoint >= 0x3100 && codePoint <= 0x312F) ||
                   (codePoint >= 0xAC00 && codePoint <= 0xD7AF) ||
                   (codePoint >= 0x1100 && codePoint <= 0x11FF);
        }

        private static bool IsPunctuation(UnicodeCategory category)
        {
            return category == UnicodeCategory.ConnectorPunctuation ||
                   category == UnicodeCategory.DashPunctuation ||
                   category == UnicodeCategory.OpenPunctuation ||
                   category == UnicodeCategory.ClosePunctuation ||
                   category == UnicodeCategory.InitialQuotePunctuation ||
                   category == UnicodeCategory.FinalQuotePunctuation ||
                   category == UnicodeCategory.OtherPunctuation;
        }

        private static bool IsSymbol(UnicodeCategory category)
        {
            return category == UnicodeCategory.MathSymbol ||
                   category == UnicodeCategory.CurrencySymbol ||
                   category == UnicodeCategory.ModifierSymbol ||
                   category == UnicodeCategory.OtherSymbol;
        }
    }

    internal sealed class TokenizerProfile
    {
        public string key = "heuristic";
        public string label = "hybrid/heuristic";
        public double asciiCharsPerToken = 4.0;
        public double cjkWeight = 1.0;
        public double punctuationWeight = 1.0;
        public double symbolWeight = 1.0;
        public double emojiWeight = 2.0;
        public double multiplier = 1.0;
        public int tokensPerMessage = 2;
        public int tokensPerName = 1;
        public int requestPaddingTokens = 0;

        public static TokenizerProfile CreateFallback()
        {
            return Create("heuristic", "hybrid/heuristic", 4.0, 1.0, 1.0, 1.0, 2.0, 1.0, 2, 1, 0);
        }

        public static TokenizerProfile Create(
            string key,
            string label,
            double asciiCharsPerToken,
            double cjkWeight,
            double punctuationWeight,
            double symbolWeight,
            double emojiWeight,
            double multiplier,
            int tokensPerMessage,
            int tokensPerName,
            int requestPaddingTokens)
        {
            return new TokenizerProfile
            {
                key = key,
                label = label,
                asciiCharsPerToken = Math.Max(1.0, asciiCharsPerToken),
                cjkWeight = Math.Max(0.25, cjkWeight),
                punctuationWeight = Math.Max(0.25, punctuationWeight),
                symbolWeight = Math.Max(0.25, symbolWeight),
                emojiWeight = Math.Max(1.0, emojiWeight),
                multiplier = Math.Max(0.25, multiplier),
                tokensPerMessage = Math.Max(0, tokensPerMessage),
                tokensPerName = tokensPerName,
                requestPaddingTokens = Math.Max(0, requestPaddingTokens)
            };
        }
    }

    public static class TokenCounterFactory
    {
        public static ITokenCounter Create(string tokenizerKey, string modelName)
        {
            return new HybridTokenCounter(ResolveProfile(tokenizerKey, modelName));
        }

        public static string[] GetAvailableTokenizerKeys()
        {
            return new[]
            {
                "best_match",
                "heuristic",
                "openai",
                "openai_cl100k",
                "openai_o200k",
                "gpt2",
                "claude",
                "llama",
                "llama3",
                "mistral",
                "yi",
                "gemma",
                "jamba",
                "qwen2",
                "command_r",
                "command_a",
                "nemo",
                "deepseek"
            };
        }

        public static string BestMatchTokenizerKey(string modelName)
        {
            string model = NormalizeModelName(modelName);

            if (ContainsAny(model, "gpt-5", "gpt5", "gpt-4o", "chatgpt-4o", "gpt-4.1", "gpt-4.5", "o1", "o3", "o4", "gpt-oss"))
            {
                return "openai_o200k";
            }

            if (ContainsAny(model, "gpt-4", "gpt-3.5", "text-embedding-ada", "text-davinci", "code-davinci"))
            {
                return "openai_cl100k";
            }

            if (model.Contains("claude"))
            {
                return "claude";
            }

            if (ContainsAny(model, "deepseek", "sonar-reasoning") || model == "r1" || model.Contains("/r1") || model.Contains("-r1"))
            {
                return "deepseek";
            }

            if (ContainsAny(model, "qwen", "qwq", "tongyi", "kimi"))
            {
                return "qwen2";
            }

            if (ContainsAny(model, "command-a"))
            {
                return "command_a";
            }

            if (ContainsAny(model, "command-r", "command_r", "cohere"))
            {
                return "command_r";
            }

            if (ContainsAny(model, "nemo", "pixtral"))
            {
                return "nemo";
            }

            if (ContainsAny(model, "llama3", "llama-3", "llama 3") || model.StartsWith("l3", StringComparison.Ordinal))
            {
                return "llama3";
            }

            if (ContainsAny(model, "llama", "longcat", "hermes"))
            {
                return "llama";
            }

            if (ContainsAny(model, "mistral", "mixtral"))
            {
                return "mistral";
            }

            if (model.Contains("yi"))
            {
                return "yi";
            }

            if (ContainsAny(model, "gemini", "learnlm", "gemma"))
            {
                return "gemma";
            }

            if (model.Contains("jamba"))
            {
                return "jamba";
            }

            return "heuristic";
        }

        public static string ResolveTokenizerKey(string tokenizerKey, string modelName)
        {
            string key = NormalizeTokenizerKey(tokenizerKey);
            if (string.IsNullOrWhiteSpace(key) || key == "best_match")
            {
                return BestMatchTokenizerKey(modelName);
            }

            if (key == "openai")
            {
                string modelMatch = BestMatchTokenizerKey(modelName);
                return modelMatch.StartsWith("openai", StringComparison.Ordinal)
                    ? modelMatch
                    : "openai_cl100k";
            }

            if (key == "gemini" || key == "learnlm")
            {
                return "gemma";
            }

            if (key == "qwen" || key == "qwen3")
            {
                return "qwen2";
            }

            if (key == "command_r")
            {
                return "command_r";
            }

            if (key == "command_a")
            {
                return "command_a";
            }

            if (key == "llama_3")
            {
                return "llama3";
            }

            return key;
        }

        public static string ResolveTokenizerLabel(string tokenizerKey, string modelName)
        {
            return ResolveProfile(tokenizerKey, modelName).label;
        }

        internal static TokenizerProfile ResolveProfile(string tokenizerKey, string modelName)
        {
            string key = ResolveTokenizerKey(tokenizerKey, modelName);
            switch (key)
            {
                case "openai_o200k":
                    return TokenizerProfile.Create("openai_o200k", "hybrid/openai-o200k", 4.2, 0.82, 0.70, 1.0, 2.0, 1.00, 3, 1, 3);
                case "openai_cl100k":
                    return TokenizerProfile.Create("openai_cl100k", "hybrid/openai-cl100k", 4.0, 1.00, 0.75, 1.0, 2.0, 1.00, 3, 1, 3);
                case "gpt2":
                    return TokenizerProfile.Create("gpt2", "hybrid/gpt2", 3.45, 1.45, 0.90, 1.0, 2.0, 1.00, 1, 0, 0);
                case "claude":
                    return TokenizerProfile.Create("claude", "hybrid/claude", 3.75, 0.95, 0.85, 1.0, 2.0, 1.03, 4, 1, 2);
                case "llama":
                    return TokenizerProfile.Create("llama", "hybrid/llama-spm", 3.55, 1.30, 1.00, 1.0, 2.0, 1.03, 1, 0, 1);
                case "llama3":
                    return TokenizerProfile.Create("llama3", "hybrid/llama3", 3.85, 1.00, 0.95, 1.0, 2.0, 1.02, 2, 0, 1);
                case "mistral":
                    return TokenizerProfile.Create("mistral", "hybrid/mistral-spm", 3.65, 1.20, 1.00, 1.0, 2.0, 1.02, 1, 0, 1);
                case "yi":
                    return TokenizerProfile.Create("yi", "hybrid/yi-spm", 3.70, 1.10, 1.00, 1.0, 2.0, 1.01, 1, 0, 1);
                case "gemma":
                    return TokenizerProfile.Create("gemma", "hybrid/gemma-gemini", 3.90, 1.00, 0.95, 1.0, 2.0, 1.00, 2, 0, 1);
                case "jamba":
                    return TokenizerProfile.Create("jamba", "hybrid/jamba", 3.70, 1.10, 1.00, 1.0, 2.0, 1.02, 1, 0, 1);
                case "qwen2":
                    return TokenizerProfile.Create("qwen2", "hybrid/qwen2-qwen3", 3.85, 0.95, 0.90, 1.0, 2.0, 0.98, 2, 0, 1);
                case "command_r":
                    return TokenizerProfile.Create("command_r", "hybrid/command-r", 3.80, 1.00, 0.95, 1.0, 2.0, 1.02, 2, 0, 1);
                case "command_a":
                    return TokenizerProfile.Create("command_a", "hybrid/command-a", 3.85, 1.00, 0.95, 1.0, 2.0, 1.02, 2, 0, 1);
                case "nemo":
                    return TokenizerProfile.Create("nemo", "hybrid/nemo-pixtral", 3.70, 1.05, 0.95, 1.0, 2.0, 1.02, 1, 0, 1);
                case "deepseek":
                    return TokenizerProfile.Create("deepseek", "hybrid/deepseek", 3.75, 0.95, 0.90, 1.0, 2.0, 1.00, 2, 0, 1);
                case "heuristic":
                    return TokenizerProfile.CreateFallback();
                default:
                    return TokenizerProfile.CreateFallback();
            }
        }

        private static string NormalizeTokenizerKey(string tokenizerKey)
        {
            return (tokenizerKey ?? "")
                .Trim()
                .ToLowerInvariant()
                .Replace("-", "_");
        }

        private static string NormalizeModelName(string modelName)
        {
            return (modelName ?? "").Trim().ToLowerInvariant();
        }

        private static bool ContainsAny(string text, params string[] needles)
        {
            foreach (string needle in needles)
            {
                if (!string.IsNullOrEmpty(needle) && text.Contains(needle))
                {
                    return true;
                }
            }

            return false;
        }
    }
}
