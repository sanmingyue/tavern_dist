using System;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Mingyue.YueZhiWu
{
    public class MoonHouseDemoUI : MonoBehaviour
    {
        public MoonHouseBackend backend;
        public bool buildOnStart = true;
        public Font uiFont;

        private Canvas canvas;
        private ScrollRect scrollRect;
        private RectTransform chatContent;
        private Text chatText;
        private Text statusText;
        private Text modelText;
        private InputField inputField;
        private Button sendButton;
        private Button debugButton;
        private Button clearButton;
        private Button modelButton;
        private Button newGameButton;
        private string pendingPlayerText = "";
        private bool isSending;

        private void Start()
        {
            ResolveBackend();

            if (buildOnStart)
            {
                BuildUi();
            }

            if (backend != null)
            {
                backend.MessageAdded += OnBackendMessageAdded;
                backend.SaveChanged += OnBackendSaveChanged;
            }

            RenderMessages();
        }

        private void OnDestroy()
        {
            if (backend != null)
            {
                backend.MessageAdded -= OnBackendMessageAdded;
                backend.SaveChanged -= OnBackendSaveChanged;
            }
        }

        private void ResolveBackend()
        {
            if (backend != null)
            {
                return;
            }

            backend = GetComponent<MoonHouseBackend>();
            if (backend == null)
            {
                backend = FindAnyObjectByType<MoonHouseBackend>();
            }
        }

        private void BuildUi()
        {
            if (canvas != null)
            {
                return;
            }

            EnsureEventSystem();
            uiFont = uiFont != null ? uiFont : LoadDefaultFont();

            GameObject canvasObject = new GameObject("MoonHouseDemoCanvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            canvasObject.transform.SetParent(transform, false);
            canvas = canvasObject.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;

            CanvasScaler scaler = canvasObject.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1600, 900);
            scaler.matchWidthOrHeight = 0.5f;

            GameObject root = CreatePanel("Root", canvasObject.transform, new Color(0.08f, 0.09f, 0.095f, 1f));
            Stretch(root.GetComponent<RectTransform>(), 0f, 0f, 1f, 1f, Vector2.zero, Vector2.zero);

            GameObject portraitPanel = CreatePanel("PortraitPanel", root.transform, new Color(0.12f, 0.14f, 0.13f, 1f));
            Stretch(portraitPanel.GetComponent<RectTransform>(), 0f, 0f, 0.30f, 1f, new Vector2(24, 24), new Vector2(-12, -24));

            Text portraitTitle = CreateText("PortraitTitle", portraitPanel.transform, ResolveCharacterName(), 28, FontStyle.Bold, TextAnchor.UpperLeft);
            Stretch(portraitTitle.rectTransform, 0f, 0.84f, 1f, 1f, new Vector2(24, 0), new Vector2(-24, -18));

            Text portraitPlaceholder = CreateText(
                "PortraitPlaceholder",
                portraitPanel.transform,
                "立绘位",
                44,
                FontStyle.Normal,
                TextAnchor.MiddleCenter);
            portraitPlaceholder.color = new Color(0.72f, 0.78f, 0.74f, 0.72f);
            Stretch(portraitPlaceholder.rectTransform, 0f, 0.10f, 1f, 0.82f, new Vector2(24, 0), new Vector2(-24, 0));

            GameObject chatPanel = CreatePanel("ChatPanel", root.transform, new Color(0.10f, 0.105f, 0.115f, 1f));
            Stretch(chatPanel.GetComponent<RectTransform>(), 0.30f, 0f, 1f, 1f, new Vector2(12, 24), new Vector2(-24, -24));

            Text title = CreateText("Title", chatPanel.transform, "月之屋", 30, FontStyle.Bold, TextAnchor.MiddleLeft);
            Stretch(title.rectTransform, 0f, 0.91f, 0.38f, 1f, new Vector2(22, 0), new Vector2(0, -8));

            modelText = CreateText("ModelText", chatPanel.transform, "", 18, FontStyle.Normal, TextAnchor.MiddleRight);
            modelText.color = new Color(0.72f, 0.78f, 0.86f, 1f);
            Stretch(modelText.rectTransform, 0.38f, 0.91f, 1f, 1f, new Vector2(0, 0), new Vector2(-22, -8));

            GameObject scrollObject = CreateScrollArea(chatPanel.transform);
            Stretch(scrollObject.GetComponent<RectTransform>(), 0f, 0.24f, 1f, 0.90f, new Vector2(22, 8), new Vector2(-22, -8));

            GameObject controlBar = CreateControlBar(chatPanel.transform);
            Stretch(controlBar.GetComponent<RectTransform>(), 0f, 0.16f, 1f, 0.23f, new Vector2(22, 0), new Vector2(-22, -4));

            inputField = CreateInputField(chatPanel.transform);
            Stretch(inputField.GetComponent<RectTransform>(), 0f, 0.045f, 0.80f, 0.15f, new Vector2(22, 0), new Vector2(-8, 0));
            inputField.text = "玩家操作：走进灵庭，看看她今天的状态。";
            inputField.onEndEdit.AddListener(value =>
            {
                if (Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.KeypadEnter))
                {
                    _ = SendCurrentInputAsync();
                }
            });

            sendButton = CreateButton(chatPanel.transform, "发送", "SendButton", 22);
            Stretch(sendButton.GetComponent<RectTransform>(), 0.80f, 0.045f, 1f, 0.15f, new Vector2(8, 0), new Vector2(-22, 0));
            sendButton.onClick.AddListener(() => _ = SendCurrentInputAsync());

            statusText = CreateText("StatusText", chatPanel.transform, "", 16, FontStyle.Normal, TextAnchor.MiddleLeft);
            statusText.color = new Color(0.66f, 0.70f, 0.76f, 1f);
            Stretch(statusText.rectTransform, 0f, 0f, 1f, 0.04f, new Vector2(22, 0), new Vector2(-22, 0));
        }

        private GameObject CreateScrollArea(Transform parent)
        {
            GameObject scrollObject = CreatePanel("StoryScroll", parent, new Color(0.075f, 0.078f, 0.086f, 1f));
            scrollRect = scrollObject.AddComponent<ScrollRect>();
            scrollRect.horizontal = false;
            scrollRect.vertical = true;
            scrollRect.movementType = ScrollRect.MovementType.Clamped;
            scrollRect.inertia = true;
            scrollRect.scrollSensitivity = 32f;

            GameObject viewportObject = new GameObject("Viewport", typeof(RectTransform), typeof(RectMask2D));
            viewportObject.transform.SetParent(scrollObject.transform, false);
            RectTransform viewportRect = viewportObject.GetComponent<RectTransform>();
            Stretch(viewportRect, 0f, 0f, 1f, 1f, Vector2.zero, Vector2.zero);

            GameObject contentObject = new GameObject("Content", typeof(RectTransform), typeof(VerticalLayoutGroup), typeof(ContentSizeFitter));
            contentObject.transform.SetParent(viewportObject.transform, false);
            chatContent = contentObject.GetComponent<RectTransform>();
            chatContent.anchorMin = new Vector2(0f, 1f);
            chatContent.anchorMax = new Vector2(1f, 1f);
            chatContent.pivot = new Vector2(0.5f, 1f);
            chatContent.anchoredPosition = Vector2.zero;
            chatContent.sizeDelta = Vector2.zero;

            VerticalLayoutGroup layout = contentObject.GetComponent<VerticalLayoutGroup>();
            layout.padding = new RectOffset(18, 18, 18, 18);
            layout.spacing = 0f;
            layout.childAlignment = TextAnchor.UpperLeft;
            layout.childControlWidth = true;
            layout.childControlHeight = true;
            layout.childForceExpandWidth = true;
            layout.childForceExpandHeight = false;

            ContentSizeFitter fitter = contentObject.GetComponent<ContentSizeFitter>();
            fitter.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            chatText = CreateText("ChatText", contentObject.transform, "", 20, FontStyle.Normal, TextAnchor.UpperLeft);
            chatText.horizontalOverflow = HorizontalWrapMode.Wrap;
            chatText.verticalOverflow = VerticalWrapMode.Overflow;
            chatText.lineSpacing = 1.25f;
            chatText.gameObject.AddComponent<LayoutElement>().flexibleWidth = 1f;

            scrollRect.viewport = viewportRect;
            scrollRect.content = chatContent;
            return scrollObject;
        }

        private GameObject CreateControlBar(Transform parent)
        {
            GameObject bar = CreatePanel("MoonHouseControlBar", parent, new Color(0.10f, 0.105f, 0.115f, 1f));

            debugButton = CreateButton(bar.transform, "调试", "PromptDebugButton", 18);
            Stretch(debugButton.GetComponent<RectTransform>(), 0f, 0f, 0.24f, 1f, Vector2.zero, new Vector2(-8, 0));
            debugButton.onClick.AddListener(ShowPromptDebug);

            clearButton = CreateButton(bar.transform, "清空", "ClearButton", 18);
            Stretch(clearButton.GetComponent<RectTransform>(), 0.25f, 0f, 0.49f, 1f, new Vector2(0, 0), new Vector2(-8, 0));
            clearButton.onClick.AddListener(ClearConversation);

            modelButton = CreateButton(bar.transform, "换模型", "CycleModelButton", 18);
            Stretch(modelButton.GetComponent<RectTransform>(), 0.50f, 0f, 0.74f, 1f, new Vector2(0, 0), new Vector2(-8, 0));
            modelButton.onClick.AddListener(CycleModel);

            newGameButton = CreateButton(bar.transform, "新档", "NewGameButton", 18);
            Stretch(newGameButton.GetComponent<RectTransform>(), 0.75f, 0f, 1f, 1f, new Vector2(0, 0), Vector2.zero);
            newGameButton.onClick.AddListener(NewGameFromConfig);

            return bar;
        }

        private InputField CreateInputField(Transform parent)
        {
            GameObject inputObject = CreatePanel("PlayerInput", parent, new Color(0.16f, 0.17f, 0.18f, 1f));
            InputField field = inputObject.AddComponent<InputField>();

            Text text = CreateText("Text", inputObject.transform, "", 20, FontStyle.Normal, TextAnchor.MiddleLeft);
            text.color = new Color(0.93f, 0.93f, 0.90f, 1f);
            Stretch(text.rectTransform, 0f, 0f, 1f, 1f, new Vector2(16, 8), new Vector2(-16, -8));

            Text placeholder = CreateText("Placeholder", inputObject.transform, "输入本轮行动", 20, FontStyle.Italic, TextAnchor.MiddleLeft);
            placeholder.color = new Color(0.55f, 0.57f, 0.60f, 1f);
            Stretch(placeholder.rectTransform, 0f, 0f, 1f, 1f, new Vector2(16, 8), new Vector2(-16, -8));

            field.textComponent = text;
            field.placeholder = placeholder;
            field.lineType = InputField.LineType.SingleLine;
            return field;
        }

        private Button CreateButton(Transform parent, string label, string name = "Button", int fontSize = 22)
        {
            GameObject buttonObject = CreatePanel(name, parent, new Color(0.28f, 0.38f, 0.50f, 1f));
            Button button = buttonObject.AddComponent<Button>();
            ColorBlock colors = button.colors;
            colors.normalColor = new Color(0.28f, 0.38f, 0.50f, 1f);
            colors.highlightedColor = new Color(0.36f, 0.48f, 0.62f, 1f);
            colors.pressedColor = new Color(0.22f, 0.30f, 0.40f, 1f);
            colors.disabledColor = new Color(0.20f, 0.22f, 0.24f, 1f);
            button.colors = colors;

            Text text = CreateText("Text", buttonObject.transform, label, fontSize, FontStyle.Bold, TextAnchor.MiddleCenter);
            Stretch(text.rectTransform, 0f, 0f, 1f, 1f, Vector2.zero, Vector2.zero);
            return button;
        }

        private GameObject CreatePanel(string name, Transform parent, Color color)
        {
            GameObject panel = new GameObject(name, typeof(RectTransform), typeof(Image));
            panel.transform.SetParent(parent, false);
            Image image = panel.GetComponent<Image>();
            image.color = color;
            return panel;
        }

        private Text CreateText(string name, Transform parent, string text, int size, FontStyle style, TextAnchor anchor)
        {
            GameObject textObject = new GameObject(name, typeof(RectTransform), typeof(Text));
            textObject.transform.SetParent(parent, false);
            Text uiText = textObject.GetComponent<Text>();
            uiText.font = uiFont;
            uiText.text = text;
            uiText.fontSize = size;
            uiText.fontStyle = style;
            uiText.alignment = anchor;
            uiText.color = new Color(0.90f, 0.91f, 0.89f, 1f);
            return uiText;
        }

        private static void Stretch(RectTransform rect, float minX, float minY, float maxX, float maxY, Vector2 offsetMin, Vector2 offsetMax)
        {
            rect.anchorMin = new Vector2(minX, minY);
            rect.anchorMax = new Vector2(maxX, maxY);
            rect.offsetMin = offsetMin;
            rect.offsetMax = offsetMax;
        }

        private async Task SendCurrentInputAsync()
        {
            if (isSending || backend == null || inputField == null)
            {
                return;
            }

            string text = inputField.text.Trim();
            if (string.IsNullOrWhiteSpace(text))
            {
                SetStatus("请输入行动。");
                return;
            }

            isSending = true;
            SetUiInteractable(false);
            pendingPlayerText = text;
            inputField.text = "";
            RenderMessages();
            SetStatus("发送中...");

            try
            {
                MoonHouseGenerationResult result = await backend.GenerateStoryAsync(text);
                pendingPlayerText = "";
                SetStatus("已回复: " + result.createdAtIso);
                RenderMessages();
            }
            catch (Exception error)
            {
                pendingPlayerText = "";
                inputField.text = text;
                RenderMessages();
                SetStatus("请求失败: " + error.Message);
            }
            finally
            {
                isSending = false;
                SetUiInteractable(true);
            }
        }

        private void OnBackendMessageAdded(MoonHouseMessage message)
        {
            if (message != null && string.Equals(message.role, "user", StringComparison.OrdinalIgnoreCase))
            {
                pendingPlayerText = "";
            }

            RenderMessages();
        }

        private void OnBackendSaveChanged()
        {
            RenderMessages();
        }

        private void RenderMessages()
        {
            if (chatText == null)
            {
                return;
            }

            bool hasSavedMessages = backend != null
                && backend.SaveData != null
                && backend.SaveData.messages != null
                && backend.SaveData.messages.Count > 0;
            bool hasPendingPlayerText = !string.IsNullOrWhiteSpace(pendingPlayerText);

            if (!hasSavedMessages && !hasPendingPlayerText)
            {
                chatText.text = " ";
                UpdateModelText();
                ResizeChatContent();
                return;
            }

            StringBuilder builder = new StringBuilder();
            if (hasSavedMessages)
            {
                foreach (MoonHouseMessage message in backend.SaveData.messages)
                {
                    string label = ResolveRoleLabel(message.role);
                    string content = CleanDisplayText(message.content);
                    if (string.IsNullOrWhiteSpace(content))
                    {
                        continue;
                    }

                    builder.AppendLine(label);
                    builder.AppendLine(content);
                    builder.AppendLine();
                }
            }

            if (hasPendingPlayerText)
            {
                builder.AppendLine(ResolveRoleLabel("user"));
                builder.AppendLine(CleanDisplayText(pendingPlayerText));
                builder.AppendLine();
            }

            chatText.text = builder.ToString().TrimEnd();
            UpdateModelText();
            ResizeChatContent();
        }

        private void ResizeChatContent()
        {
            Canvas.ForceUpdateCanvases();
            if (chatContent != null)
            {
                LayoutRebuilder.ForceRebuildLayoutImmediate(chatContent);
            }

            Canvas.ForceUpdateCanvases();
            if (scrollRect != null)
            {
                scrollRect.verticalNormalizedPosition = 0f;
            }
        }

        private void UpdateModelText()
        {
            if (modelText == null)
            {
                return;
            }

            string model = backend != null && backend.config != null && backend.config.generationPreset != null
                ? backend.config.generationPreset.model
                : "未配置模型";
            modelText.text = model;
        }

        private void SetUiInteractable(bool interactable)
        {
            if (inputField != null)
            {
                inputField.interactable = interactable;
            }

            if (sendButton != null)
            {
                sendButton.interactable = interactable;
            }

            if (debugButton != null)
            {
                debugButton.interactable = interactable;
            }

            if (clearButton != null)
            {
                clearButton.interactable = interactable;
            }

            if (modelButton != null)
            {
                modelButton.interactable = interactable;
            }

            if (newGameButton != null)
            {
                newGameButton.interactable = interactable;
            }
        }

        private void ShowPromptDebug()
        {
            if (backend == null || chatText == null)
            {
                return;
            }

            string text = inputField != null && !string.IsNullOrWhiteSpace(inputField.text)
                ? inputField.text
                : "观察她当前状态";
            PromptAssembly assembly = backend.PreviewPrompt(text);
            chatText.text = assembly.debugSummary + "\n\n" + assembly.worldbookDebug + "\n\n" + assembly.tokenDebug;
            UpdateModelText();
            ResizeChatContent();
            SetStatus("已显示本轮提示词调试，不会写入聊天。");
        }

        private void ClearConversation()
        {
            if (backend == null || isSending)
            {
                return;
            }

            backend.ClearMessages();
            SetStatus("已清空聊天历史。");
        }

        private void NewGameFromConfig()
        {
            if (backend == null || isSending)
            {
                return;
            }

            backend.NewGameFromConfig();
            SetStatus("已从当前配置开始新档。");
        }

        private void CycleModel()
        {
            if (backend == null || backend.config == null)
            {
                return;
            }

            MoonHouseGenerationPreset preset = backend.config.GetActivePreset();
            if (preset.availableModels == null || preset.availableModels.Count == 0)
            {
                SetStatus("还没有模型列表，请先在 Inspector 刷新模型。");
                return;
            }

            int currentIndex = preset.availableModels.IndexOf(preset.model);
            int nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % preset.availableModels.Count;
            backend.SelectModel(preset.availableModels[nextIndex]);
            UpdateModelText();
            SetStatus("已切换模型: " + preset.model);
        }

        private void SetStatus(string text)
        {
            if (statusText != null)
            {
                statusText.text = text;
            }
        }

        private string ResolveCharacterName()
        {
            if (backend != null && backend.config != null && !string.IsNullOrWhiteSpace(backend.config.characterName))
            {
                return backend.config.characterName;
            }

            return "月之屋角色";
        }

        private string ResolveRoleLabel(string role)
        {
            switch ((role ?? string.Empty).ToLowerInvariant())
            {
                case "user":
                    return "三明月";
                case "assistant":
                    return ResolveCharacterName();
                case "system":
                    return "系统";
                default:
                    return role;
            }
        }

        private static string CleanDisplayText(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return "";
            }

            string cleaned = text
                .Replace("<player_action>", "")
                .Replace("</player_action>", "")
                .Trim();

            if (cleaned.StartsWith("玩家操作：", StringComparison.Ordinal))
            {
                cleaned = cleaned.Substring("玩家操作：".Length).Trim();
            }
            else if (cleaned.StartsWith("玩家操作:", StringComparison.Ordinal))
            {
                cleaned = cleaned.Substring("玩家操作:".Length).Trim();
            }

            return cleaned;
        }

        private static Font LoadDefaultFont()
        {
            Font font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            if (font == null)
            {
                font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            }

            return font;
        }

        private static void EnsureEventSystem()
        {
            if (FindAnyObjectByType<EventSystem>() != null)
            {
                return;
            }

            GameObject eventSystemObject = new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
            eventSystemObject.transform.SetAsLastSibling();
        }
    }
}
