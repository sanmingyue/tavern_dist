import subprocess
result = subprocess.run(["python", "-m", "pip", "install", "python-docx", "-q"], capture_output=True, text=True)
print(result.stdout)
print(result.stderr)
