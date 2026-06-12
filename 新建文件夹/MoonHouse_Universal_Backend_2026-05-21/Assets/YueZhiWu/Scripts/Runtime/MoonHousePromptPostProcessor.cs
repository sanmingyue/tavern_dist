using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Newtonsoft.Json;

namespace Mingyue.YueZhiWu
{
    public static class MoonHousePromptPostProcessor
    {
        public static List<MoonHouseMessage> Process(
            List<MoonHouseMessage> messages,
            MoonHouseGenerationPreset preset)
        {
            List<MoonHouseMessage> safeMessages = (messages ?? new List<MoonHouseMessage>())
                .Where(message => message != null && !string.IsNullOrWhiteSpace(message.content))
                .Select(message => new MoonHouseMessage(NormalizeRole(message.role), message.content))
                .ToList();

            if (safeMessages.Count == 0 || preset == null)
            {
                return safeMessages;
            }

            switch (preset.promptPostProcessor)
            {
                case MoonHousePromptPostProcessorMode.SingleUserMessage:
                    return new List<MoonHouseMessage>
                    {
                        new MoonHouseMessage("user", BuildPrefixedTranscript(safeMessages, preset))
                    };
                case MoonHousePromptPostProcessorMode.NoAssLike:
                    return new List<MoonHouseMessage>
                    {
                        new MoonHouseMessage(
                            NormalizeRole(preset.noAssSquashRole),
                            ProcessNoAssLike(BuildPrefixedTranscript(safeMessages, preset), preset))
                    };
                default:
                    return safeMessages;
            }
        }

        private static string BuildPrefixedTranscript(
            List<MoonHouseMessage> messages,
            MoonHouseGenerationPreset preset)
        {
            StringBuilder builder = new StringBuilder();
            string lastPrefix = "";

            foreach (MoonHouseMessage message in messages)
            {
                string prefix = ResolvePrefix(message.role, preset);
                string content = (message.content ?? string.Empty).Trim();
                if (string.IsNullOrWhiteSpace(content))
                {
                    continue;
                }

                if (builder.Length > 0)
                {
                    builder.AppendLine();
                    builder.AppendLine();
                }

                if (!string.Equals(prefix, lastPrefix, StringComparison.Ordinal))
                {
                    builder.Append(prefix);
                    builder.Append(": ");
                    lastPrefix = prefix;
                }

                builder.Append(content);
            }

            return builder.ToString().Trim();
        }

        private static string ProcessNoAssLike(string prompt, MoonHouseGenerationPreset preset)
        {
            string content = prompt ?? string.Empty;
            content = ApplyRegexTags(content, 1);
            content = ApplyDepthInsertions(content, preset);
            content = ApplyRegexTags(content, 2);
            content = MergeAdjacentPrefixedBlocks(content, preset);
            content = ApplyRegexTags(content, 3);
            content = CleanupControlTags(content);

            if (!string.IsNullOrWhiteSpace(preset.noAssSeparator))
            {
                content = InsertSeparator(content, preset);
            }

            return content.Trim();
        }

        private static string ApplyDepthInsertions(string content, MoonHouseGenerationPreset preset)
        {
            string user = Regex.Escape(ResolvePrefix("user", preset));
            string assistant = Regex.Escape(ResolvePrefix("assistant", preset));
            string system = Regex.Escape(ResolvePrefix("system", preset));
            string splitPattern = "\n\n(?=(" + user + "|" + assistant + "|" + system + "):)";
            List<string> parts = Regex.Split(content, splitPattern)
                .Where(part => !string.IsNullOrEmpty(part) &&
                               !Regex.IsMatch(part, "^(" + user + "|" + assistant + "|" + system + ")$"))
                .ToList();

            MatchCollection matches = Regex.Matches(content, "<@(\\d+)>(.*?)</@\\1>", RegexOptions.Singleline);
            foreach (Match match in matches)
            {
                int depth;
                if (!int.TryParse(match.Groups[1].Value, out depth))
                {
                    continue;
                }

                int index = parts.Count - depth - 1;
                if (index >= 0 && index < parts.Count)
                {
                    parts[index] = parts[index].TrimEnd() + "\n\n" + match.Groups[2].Value.Trim();
                }
            }

            string rebuilt = parts.Count > 0 ? string.Join("\n\n", parts) : content;
            return Regex.Replace(rebuilt, "<@(\\d+)>.*?</@\\1>", "", RegexOptions.Singleline);
        }

        private static string ApplyRegexTags(string content, int order)
        {
            string orderPattern = order == 2
                ? "(?:\\s+order\\s*=\\s*2)?"
                : "\\s+order\\s*=\\s*" + order;
            string pattern = "<regex" + orderPattern + ">\\s*\"(/?)(.*)\\1([a-zA-Z]*)\"\\s*:\\s*\"(.*?)\"\\s*</regex>";
            MatchCollection matches = Regex.Matches(content, pattern, RegexOptions.Singleline);
            foreach (Match match in matches)
            {
                try
                {
                    RegexOptions options = RegexOptions.None;
                    string flags = match.Groups[3].Value;
                    if (flags.Contains("i"))
                    {
                        options |= RegexOptions.IgnoreCase;
                    }

                    if (flags.Contains("s"))
                    {
                        options |= RegexOptions.Singleline;
                    }

                    if (flags.Contains("m"))
                    {
                        options |= RegexOptions.Multiline;
                    }

                    string replacement = DecodeRegexReplacement(match.Groups[4].Value);
                    content = Regex.Replace(content, match.Groups[2].Value, replacement ?? "", options);
                }
                catch
                {
                }
            }

            return content;
        }

        private static string DecodeRegexReplacement(string raw)
        {
            try
            {
                string safe = (raw ?? string.Empty).Replace("\\\"", "\"").Replace("\"", "\\\"");
                return JsonConvert.DeserializeObject<string>("\"" + safe + "\"");
            }
            catch
            {
                return raw ?? string.Empty;
            }
        }

        private static string MergeAdjacentPrefixedBlocks(string content, MoonHouseGenerationPreset preset)
        {
            string user = Regex.Escape(ResolvePrefix("user", preset));
            string assistant = Regex.Escape(ResolvePrefix("assistant", preset));
            string system = Regex.Escape(ResolvePrefix("system", preset));
            string pattern = "\n\n(" + user + "|" + assistant + "|" + system + "):\\s*\n\n\\1:\\s*";
            string previous;
            do
            {
                previous = content;
                content = Regex.Replace(content, pattern, "\n\n$1: ");
            }
            while (!string.Equals(previous, content, StringComparison.Ordinal));

            return content;
        }

        private static string CleanupControlTags(string content)
        {
            return Regex.Replace(content, "<regex(?:\\s+order\\s*=\\s*\\d+)?>.*?</regex>", "", RegexOptions.Singleline)
                .Replace("\r\n", "\n")
                .Replace("\r", "\n")
                .Replace("<|join|>", "")
                .Replace("<|space|>", " ")
                .Replace("<|curtail|>", "\n")
                .Trim();
        }

        private static string InsertSeparator(string content, MoonHouseGenerationPreset preset)
        {
            string separator = preset.noAssSeparator ?? string.Empty;
            string user = Regex.Escape(ResolvePrefix("user", preset));
            string assistant = Regex.Escape(ResolvePrefix("assistant", preset));
            string pattern = "\n\n(?=(" + user + "|" + assistant + "):)";
            return Regex.Replace(content, pattern, "\n" + separator + "\n");
        }

        private static string ResolvePrefix(string role, MoonHouseGenerationPreset preset)
        {
            string normalized = NormalizeRole(role);
            if (normalized == "assistant")
            {
                return string.IsNullOrWhiteSpace(preset.noAssAssistantPrefix)
                    ? "Assistant"
                    : preset.noAssAssistantPrefix.Trim();
            }

            if (normalized == "system")
            {
                return string.IsNullOrWhiteSpace(preset.noAssSystemPrefix)
                    ? "SYSTEM"
                    : preset.noAssSystemPrefix.Trim();
            }

            return string.IsNullOrWhiteSpace(preset.noAssUserPrefix)
                ? "Human"
                : preset.noAssUserPrefix.Trim();
        }

        private static string NormalizeRole(string role)
        {
            string value = (role ?? "user").Trim().ToLowerInvariant();
            return value == "assistant" || value == "system" || value == "user"
                ? value
                : "user";
        }
    }
}
