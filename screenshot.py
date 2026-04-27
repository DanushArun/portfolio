from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:3000')
    
    # Wait for the page to finish loading any animations/content
    page.wait_for_load_state('networkidle')
    time.sleep(2) # Extra time for any 3D/Canvas rendering
    
    page.screenshot(path='screenshot.png', full_page=True)
    
    # Optionally, we can log out interactive elements or text for context
    print("Page Title:", page.title())
    
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
