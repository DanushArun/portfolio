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
    
    print("Scrolling through the EVENT_HORIZON and DESCENT to MIRA_PULSAR...")
    # The journey takes 6500 pixels of wheel scrolling.
    # Let's do it in increments of 500px, capturing a frame each time.
    for i in range(1, 14):
        page.mouse.wheel(0, 500)
        time.sleep(0.5) # Wait a bit for the camera to catch up
        page.screenshot(path=f'frame_{i:02d}_journey.png')
        
    print("Arrived at MIRA_PULSAR. Waiting 2 seconds...")
    time.sleep(2)
    page.screenshot(path='frame_14_mira_pulsar.png')
    
    scenes = [
        "DRIVEX_QUASAR",
        "TWIN_BUILD",
        "FORMULA_RINGS",
        "QUANTUM_PLANET",
        "SINGULARITY"
    ]
    
    print("Scrolling through cosmic scenes...")
    frame_idx = 15
    for scene in scenes:
        # Scroll down to trigger the next scene (takes > 80% of page height)
        page.mouse.wheel(0, 1000)
        print(f"Scrolled to {scene}, waiting for transition...")
        time.sleep(1.5) # Transition veil takes 0.9s
        
        page.screenshot(path=f'frame_{frame_idx:02d}_{scene}_transition.png')
        frame_idx += 1
        
        # In TWIN_BUILD, we need to drag the mouse to rotate the orbit by PI before we can scroll again
        if scene == "TWIN_BUILD":
            print("Dragging to rotate TWIN_BUILD orbit...")
            page.mouse.move(1600, 540)
            page.mouse.down()
            # Move mouse across screen to simulate drag
            page.mouse.move(200, 540, steps=20)
            page.mouse.up()
            time.sleep(1)
            page.screenshot(path=f'frame_{frame_idx:02d}_{scene}_dragged.png')
            frame_idx += 1
            
        time.sleep(1.5)
        page.screenshot(path=f'frame_{frame_idx:02d}_{scene}_settled.png')
        frame_idx += 1
        
    browser.close()
    print("Capture complete.")

with sync_playwright() as playwright:
    run(playwright)
