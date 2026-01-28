Hey! I need you to add a new feature to this Pattern Lab that lets users upload an image, generate a depth map from it, and then create a topographic map visualization based on that depth map. This is for compositing work in Photoshop/Figma.
What This Feature Does:

User uploads an image (JPG, PNG, etc.)
System generates a depth map from the image (grayscale representation where darker = closer, lighter = farther)
System creates topographic contour lines based on the depth map's elevation data
User can control the number of contour levels, line thickness, spacing, smoothness, and colors
Export as SVG or PNG for use in design software

Technical Workflow:
Step 1: Depth Map Generation

Use a simple edge-detection + gradient approach OR integrate a lightweight depth estimation library
Convert uploaded image to grayscale
Apply Sobel edge detection to identify depth boundaries
Use luminance as a proxy for depth (brighter = further away, darker = closer)
Output: A grayscale depth map (0-255 values representing elevation)

Step 2: Contour Line Generation

Treat the depth map as a heightmap (like terrain elevation data)
For each "elevation level" (e.g., 0-25, 25-50, 50-75, etc.), trace contour lines
Use marching squares algorithm to trace iso-lines at each threshold
Smooth the contour lines using Catmull-Rom spline or simple averaging
Output: Vector paths representing topographic lines

Step 3: Visualization Controls

Number of contour levels (5-50 range)
Line width (0.5-5px)
Line opacity (0.1-1.0)
Smoothing amount (0-10)
Color options: single color, gradient between two colors, or rainbow gradient
Invert depth (swap near/far)
Background transparency toggle

How to Implement This:
Add a new tab called "Depth Topo" following the existing pattern structure:

html<div class="tab" onclick="switchTab('depthmap')">Depth Topo</div>

Create the control panel section with these inputs:

File upload button (accept image files)
Canvas preview showing: original image, depth map preview, final topo result
Slider: Contour Levels (default: 20, range: 5-50)
Slider: Line Width (default: 1.5, range: 0.5-5)
Slider: Line Opacity (default: 0.8, range: 0.1-1)
Slider: Smoothing (default: 3, range: 0-10)
Checkbox: Invert Depth
Color picker: Line Color
Color picker: Background Color
Buttons: "Generate Topo", "Export SVG", "Export PNG"

Processing Pipeline:

When user uploads image:

Load image into an off-screen canvas
Convert to grayscale using luminance formula: 0.299*R + 0.587*G + 0.114*B
Store as ImageData array


For depth map generation:

Apply edge detection (Sobel filter) to enhance depth boundaries
Optional: Apply Gaussian blur for smoothing
Normalize values to 0-255 range
Display in preview canvas


For contour generation:

Divide depth range into N levels (based on "Contour Levels" slider)
For each level, use marching squares to trace iso-contours
Apply smoothing algorithm (Chaikin's algorithm works well)
Store as SVG path data


For rendering:

Draw contour lines on main canvas
Apply color, opacity, and width settings
Render background



Libraries you might need:

No external libraries required! Use native Canvas API
For marching squares: implement a simple version (there are ~100 line implementations available)
For smoothing: use Chaikin's corner cutting algorithm

Code structure to follow:

Follow the existing pattern in the file (see how generateFlow(), generateWave(), generateTopo() are structured)
Create generateDepthTopo() function
Create helper functions: generateDepthMap(imageData), traceContours(depthMap, levels), smoothPath(points, iterations)
Store SVG output in svgContent variable (like other generators do)

Key technical details:

Use <input type="file" accept="image/*"> for upload
Use FileReader API to load image
Draw uploaded image to off-screen canvas, then use ctx.getImageData() to get pixel data
For marching squares, you need a 2D grid and threshold values - check each 2x2 cell and draw lines based on which corners are above/below threshold
For smoothing, average each point with its neighbors iteratively

Important styling notes:

Match the existing dark UI aesthetic (#0a0a0a background, #141414 sidebar)
Keep the three-canvas preview layout: [Original | Depth Map | Topo Result]
Use the same button styling and control layouts as existing tabs
Add visual feedback when processing (e.g., "Generating depth map...")

Expected Output:
When complete, users should be able to:

Upload a portrait photo
See the auto-generated depth map (face = darker/closer, background = lighter/further)
Adjust contour line density and styling
Export clean SVG with transparent background for compositing in Photoshop
Or export PNG with controlled background color

The topographic lines should follow the depth contours naturally - like elevation lines on a map, but representing the 3D depth of the original image.
Testing suggestion: Use a photo with clear foreground/background separation (portrait with blurred background works great) to see dramatic contour effects.
Make sure to follow the existing code style and structure - everything should feel like a natural extension of the current Pattern Lab interface!