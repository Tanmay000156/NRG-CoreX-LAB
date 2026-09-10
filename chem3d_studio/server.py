"""
Chem3D Studio - Local Web Server & Launcher
Starts a local HTTP server and automatically opens Microsoft Edge or default browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Clean terminal output
        print(f"[Chem3D Server] {args[0]} - {args[1]}")

def run():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Try port 8000, or fallback if in use
    global PORT
    for p in range(8000, 8020):
        try:
            with socketserver.TCPServer(("", p), QuietHandler) as httpd:
                PORT = p
                url = f"http://localhost:{PORT}/index.html"
                print("=" * 60)
                print("   Chem3D Studio - Interactive 3D Chemistry Simulator")
                print("=" * 60)
                print(f"-> Server running at: {url}")
                print("-> Press Ctrl+C in terminal to stop server.")
                print("=" * 60)
                
                # Open browser
                webbrowser.open(url)
                
                httpd.serve_forever()
                break
        except OSError:
            continue

if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        print("\nChem3D Studio server stopped.")
        sys.exit(0)
