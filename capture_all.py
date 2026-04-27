from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_viewport_size({"width": 1920, "height": 1080})
    page.goto('http://localhost:3000')
    
    page.wait_for_load_state('networkidle')
    print("Page loaded, waiting for initial VOID animation (3.5s)...")
    time.sleep(4)
    
    page.screenshot(path='frame_00_landing.png')
    
    print("Scrolling smoothly through the 700vh continuous journey...")
    # Scroll in 25 increments to capture the full Z-axis flight
    for i in range(1, 26):
        # We scroll down by a fixed amount (approx 1/25 of the max scroll)
        page.mouse.wheel(0, 400)
        time.sleep(0.4) # Wait for CameraRig.tsx to lerp to the new Z position
        page.screenshot(path=f'frame_{i:02d}_journey.png')
        print(f"Captured frame {i}/25")
        
        # If we reach near the end, wait a bit for Singularity scramble text
        if i == 24:
            time.sleep(2)
            page.screenshot(path=f'frame_{i:02d}_journey_singularity.png')

    browser.close()
    print("Capture complete.")

with sync_playwright() as playwright:
    run(playwright)
