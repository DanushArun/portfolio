from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_viewport_size({"width": 1920, "height": 1080})
    page.goto('http://localhost:3000')
    
    # Wait for initial load
    page.wait_for_load_state('networkidle')
    time.sleep(2)
    
    page.screenshot(path='scroll_0.png', full_page=False)
    print("Captured initial state.")
    
    # Simulate user scrolling with the mouse wheel (most 3D canvas sites use this)
    for i in range(1, 5):
        # Scroll down significantly to trigger the next scene or animation
        page.mouse.wheel(0, 800)
        # Give it a moment to animate
        time.sleep(1.5)
        page.screenshot(path=f'scroll_{i}.png', full_page=False)
        print(f"Captured scroll step {i}.")
        
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
