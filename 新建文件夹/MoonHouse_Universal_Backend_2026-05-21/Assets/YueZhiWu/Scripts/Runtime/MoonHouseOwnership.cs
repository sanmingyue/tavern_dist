using System;

namespace Mingyue.YueZhiWu
{
    public static class MoonHouseOwnership
    {
        public const string ProductName = "月之屋 Moon House";
        public const string InternalName = "YueZhiWu";
        public const string OwnerName = "三明月";
        public const string OwnerHandle = "SanMingYue";
        public const string ProprietaryNotice = "Copyright (c) 2026 三明月. All rights reserved.";
        public const string PackageFingerprint = "moon-house-yue-zhi-wu-sanmingyue-2026";

        public static string BuildPackageMark()
        {
            return ProductName + " / " + InternalName + " / " + OwnerName + " / " +
                   PackageFingerprint + " / " + DateTime.UtcNow.ToString("O");
        }
    }
}
