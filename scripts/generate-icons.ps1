# Generates neon skating-rink icons using System.Drawing.
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "..\icons"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function New-Icon([int]$size, [string]$path) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  # Dark background
  $bg = [System.Drawing.Color]::FromArgb(255, 10, 1, 24)
  $g.Clear($bg)

  # Neon "U" glyph in fuchsia
  $fuchsia = [System.Drawing.Color]::FromArgb(255, 255, 43, 214)
  $penW = [Math]::Max(2, [int]($size / 10))
  $pen = New-Object System.Drawing.Pen($fuchsia, $penW)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

  $m = [int]($size * 0.28)
  $top = [int]($size * 0.24)
  $bot = [int]($size * 0.66)
  $g.DrawLine($pen, $m, $top, $m, $bot)
  $g.DrawLine($pen, $size - $m, $top, $size - $m, $bot)
  $g.DrawArc($pen, $m, [int]($size * 0.42), $size - 2 * $m, [int]($size * 0.44), 0, 180)

  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

New-Icon 16  (Join-Path $outDir "icon16.png")
New-Icon 48  (Join-Path $outDir "icon48.png")
New-Icon 128 (Join-Path $outDir "icon128.png")
Write-Host "Icons generated."
