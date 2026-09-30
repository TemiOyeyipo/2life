<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>L'chaim Logo - JPEG Preview</title>
    <style>
        body {
            background-color: #f4f4f4;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 40px;
        }
        .container {
            background: #ffffff;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border-radius: 8px;
            text-align: center;
        }
        img {
            max-width: 100%;
            height: auto;
            border: 1px solid #eee;
        }
        .btn {
            margin-top: 20px;
            padding: 12px 24px;
            background-color: #2C3E35;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover {
            background-color: #4A6B5D;
        }
    </style>
</head>
<body>

    <div class="container">
        <h2>L'chaim Logo (JPEG Output)</h2>
        <p>Rendered on a solid white background</p>
        <br>
        <!-- The converted JPEG image will display here -->
        <img id="jpgOutput" alt="L'chaim Logo JPEG">
        <br>
        <a id="downloadBtn" class="btn" download="lchaim-logo.jpg">Download JPEG</a>
    </div>

    <!-- Hidden SVG Source Code -->
    <svg id="svgLogo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 240" width="800" height="240" style="display: none;">
      <rect width="100%" height="100%" fill="#FFFFFF"/>
      <g transform="translate(30, 10) scale(1.65)">
        <path d="M 55 18 L 55 10 M 39 24 L 34 19 M 71 24 L 76 19 M 28 40 L 20 38 M 82 40 L 90 38" 
              stroke="#D4A359" stroke-width="2.6" stroke-linecap="round" opacity="0.9"/>
        <path d="M 30 65 A 28 28 0 1 1 80 65" 
              fill="none" stroke="#2C3E35" stroke-width="4.2" stroke-linecap="round"/>
        <path d="M 55 38 C 36 55 32 78 55 94 C 78 78 74 55 55 38 Z" 
              fill="#4A6B5D" opacity="0.95"/>
        <path d="M 55 94 C 50 81 50 65 55 54 C 60 65 60 81 55 94 Z" 
              fill="#C87D55"/>
      </g>
      <text x="225" y="128" 
            font-family="'Cinzel', 'Playfair Display', 'Georgia', serif" 
            font-size="68" 
            font-weight="700" 
            letter-spacing="3.5" 
            fill="#2C3E35">L'chaim</text>
      <text x="228" y="165" 
            font-family="'Inter', 'Helvetica Neue', 'Arial', sans-serif" 
            font-size="16" 
            font-weight="600" 
            letter-spacing="6.5" 
            fill="#C87D55" 
            opacity="0.95">NOURISHING LIFE &amp; SPIRIT</text>
    </svg>

    <script>
        window.addEventListener('DOMContentLoaded', () => {
            const svgElement = document.getElementById('svgLogo');
            const svgString = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                canvas.width = 1600; // High resolution JPEG export
                canvas.height = 480;
                
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height); // Ensures opaque white background
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                
                document.getElementById('jpgOutput').src = jpegDataUrl;
                document.getElementById('downloadBtn').href = jpegDataUrl;
                
                URL.revokeObjectURL(url);
            };
            img.src = url;
        });
    </script>
</body>
</html>
