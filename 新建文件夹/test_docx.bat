@echo off
chcp 65001 >nul
python -c "from docx import Document; print('ok')"
