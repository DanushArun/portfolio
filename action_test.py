from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_viewport_size({"width": 1920, "height": 1080})
    page.goto('http://localhost:3000')
    
    # Wait for initial load
    page.wait_for_load_state('networkidle')
    print("Page loaded, waiting for initial animation...")
    
    # Take screenshots every 1 second for the first 3 seconds
    for i in range(3):
        page.screenshot(path=f'capture_initial_{i}.png', full_page=False)
        time.sleep(1)
        
    print("Starting scroll interactions...")
    # Simulate user scrolling and capture every second
    for step in range(1, 6):
        # Scroll down
        page.mouse.wheel(0, 800)
        print(f"Scrolled step {step}. Capturing transition...")
        
        # Capture 3 frames during the transition (1 second apart)
        for frame in range(3):
            page.screenshot(path=f'capture_scroll_{step}_frame_{frame}.png', full_page=False)
            time.sleep(1)
            
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
