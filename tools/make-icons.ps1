# =============================================================================
#  X One-Click Mute / Not Interested — アイコン生成スクリプト
#  X ブルーの角丸バッジ + 白いミュート（スピーカー + 斜線）マークを
#  16 / 32 / 48 / 128 px で出力する。
#
#  使い方:  powershell -ExecutionPolicy Bypass -File tools\make-icons.ps1
# =============================================================================
Add-Type -AssemblyName System.Drawing

$root   = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'icons'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$brand = [System.Drawing.Color]::FromArgb(255, 29, 155, 240)   # X blue
$white = [System.Drawing.Color]::White
$sizes = 16, 32, 48, 128

function New-Polygon([double[][]] $pts, [double] $k) {
    $out = New-Object 'System.Drawing.PointF[]' $pts.Count
    for ($i = 0; $i -lt $pts.Count; $i++) {
        $out[$i] = New-Object System.Drawing.PointF([float]($pts[$i][0] * $k), [float]($pts[$i][1] * $k))
    }
    return $out
}

foreach ($s in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($s, $s, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.Clear([System.Drawing.Color]::Transparent)

    $w = $s - 1
    $k = $w / 24.0

    # --- 角丸バッジ ---
    $r = [float]($s * 0.22)
    $badge = New-Object System.Drawing.Drawing2D.GraphicsPath
    $badge.AddArc(0, 0, (2 * $r), (2 * $r), 180, 90)
    $badge.AddArc(($w - 2 * $r), 0, (2 * $r), (2 * $r), 270, 90)
    $badge.AddArc(($w - 2 * $r), ($w - 2 * $r), (2 * $r), (2 * $r), 0, 90)
    $badge.AddArc(0, ($w - 2 * $r), (2 * $r), (2 * $r), 90, 90)
    $badge.CloseFigure()

    $brandBrush = New-Object System.Drawing.SolidBrush($brand)
    $g.FillPath($brandBrush, $badge)

    # 以降の描画はバッジの内側にクリップ
    $g.SetClip($badge)

    # --- スピーカー（白） ---
    $speaker = @(
        @(5.5, 9.0), @(9.5, 9.0), @(13.5, 4.8),
        @(13.5, 19.2), @(9.5, 15.0), @(5.5, 15.0)
    )
    $whiteBrush = New-Object System.Drawing.SolidBrush($white)
    $g.FillPolygon($whiteBrush, (New-Polygon $speaker $k))

    # --- 斜線（白フチ + ブランド色の芯 で「切れ込み」に見せる） ---
    $cx = 12.0 * $k
    $cy = 12.0 * $k
    $a  = 135.0 * [Math]::PI / 180.0

    function New-Slash([double] $cx, [double] $cy, [double] $a, [double] $len, [double] $h) {
        $ux = [Math]::Cos($a) * $len / 2.0
        $uy = [Math]::Sin($a) * $len / 2.0
        $vx = -[Math]::Sin($a) * $h / 2.0
        $vy = [Math]::Cos($a) * $h / 2.0
        $p = New-Object 'System.Drawing.PointF[]' 4
        $p[0] = New-Object System.Drawing.PointF([float]($cx + $ux + $vx), [float]($cy + $uy + $vy))
        $p[1] = New-Object System.Drawing.PointF([float]($cx + $ux - $vx), [float]($cy + $uy - $vy))
        $p[2] = New-Object System.Drawing.PointF([float]($cx - $ux - $vx), [float]($cy - $uy - $vy))
        $p[3] = New-Object System.Drawing.PointF([float]($cx - $ux + $vx), [float]($cy - $uy + $vy))
        return $p
    }

    $len = $w * 0.82
    $g.FillPolygon($whiteBrush, (New-Slash $cx $cy $a $len ($w * 0.215)))
    $g.FillPolygon($brandBrush, (New-Slash $cx $cy $a $len ($w * 0.110)))

    $g.ResetClip()

    $path = Join-Path $outDir ("icon{0}.png" -f $s)
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

    $brandBrush.Dispose(); $whiteBrush.Dispose(); $badge.Dispose(); $g.Dispose(); $bmp.Dispose()
    Write-Host "created $path"
}

Write-Host 'done.'
