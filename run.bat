@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: CSV�����ϊ�CLI�c�[�����s�X�N���v�g
:: �g�p���@: run.bat [�ݒ�t�@�C���p�X] [--input ���̓t�@�C��] [--output �o�̓t�@�C��] [--batch]

:: �p�����[�^���
set CONFIG_FILE=config.json
set BATCH_MODE=0
set INPUT_FILE=
set OUTPUT_FILE=

:parse_args
if "%~1"=="" goto args_done
if "%~1"=="--batch" (
    set BATCH_MODE=1
    shift
    goto parse_args
)
if "%~1"=="--input" (
    shift
    set INPUT_FILE=%~1
    shift
    goto parse_args
)
if "%~1"=="--output" (
    shift
    set OUTPUT_FILE=%~1
    shift
    goto parse_args
)
:: �ŏ��̃p�����[�^��--�Ŏn�܂�Ȃ��ꍇ�͐ݒ�t�@�C���Ƃ��Ĉ���
if "%~1:~0,2%" neq "--" (
    set CONFIG_FILE=%~1
)
shift
goto parse_args

:args_done

:: �p�����[�^���\��
echo �ݒ�t�@�C��: !CONFIG_FILE!
if not "!INPUT_FILE!"=="" echo ���̓t�@�C�����㏑��: !INPUT_FILE!
if not "!OUTPUT_FILE!"=="" echo �o�̓t�@�C�����㏑��: !OUTPUT_FILE!

:: �ݒ�t�@�C���̑��݃`�F�b�N
if not exist "!CONFIG_FILE!" (
    echo �G���[: �ݒ�t�@�C�� '!CONFIG_FILE!' ��������܂���B
    if %BATCH_MODE% equ 0 pause
    exit /b 1
)

:: Node.js�̑��݃`�F�b�N
where node >nul 2>&1
if errorlevel 1 (
    echo �G���[: Node.js���C���X�g�[������Ă��܂���B
    echo https://nodejs.org/ ����_�E�����[�h���ăC���X�g�[�����Ă��������B
    if %BATCH_MODE% equ 0 pause
    exit /b 1
)

:: package.json�̑��݃`�F�b�N
if not exist "package.json" (
    echo �G���[: package.json��������܂���B�������f�B���N�g���Ŏ��s���Ă��������B
    if %BATCH_MODE% equ 0 pause
    exit /b 1
)

:: �ˑ��֌W�̃C���X�g�[���m�F
if not exist "node_modules" (
    echo �ˑ��֌W���C���X�g�[����...
    call npm install
    if errorlevel 1 (
        echo �G���[: �ˑ��֌W�̃C���X�g�[���Ɏ��s���܂����B
        if %BATCH_MODE% equ 0 pause
        exit /b 1
    )
)

:: �r���h�ς݃t�@�C���̊m�F
if not exist "dist\cli.js" (
    echo �r���h�t�@�C����������܂���B�r���h�����s��...
    call npm run build
    if errorlevel 1 (
        echo �G���[: �r���h�Ɏ��s���܂����B
        if %BATCH_MODE% equ 0 pause
        exit /b 1
    )
)

:: CSV�ϊ��c�[���̎��s
echo CSV�����ϊ��c�[�������s��...

:: �R�}���h���C���������\�z
set CLI_ARGS=--config "!CONFIG_FILE!"
if not "!INPUT_FILE!"=="" (
    set CLI_ARGS=!CLI_ARGS! --input "!INPUT_FILE!"
)
if not "!OUTPUT_FILE!"=="" (
    set CLI_ARGS=!CLI_ARGS! --output "!OUTPUT_FILE!"
)

node dist\cli.js !CLI_ARGS!
set TOOL_EXIT_CODE=%errorlevel%

if %TOOL_EXIT_CODE% equ 0 (
    echo CSV�ϊ��������������܂����B
) else if %TOOL_EXIT_CODE% equ 2 (
    echo �x��: CSV�ϊ������͊������܂������A�x�����������܂����B���O���m�F���Ă��������B
    if %BATCH_MODE% equ 0 pause
    exit /b 2
) else (
    echo �G���[: CSV�ϊ������Ɏ��s���܂����B
    if %BATCH_MODE% equ 0 pause
    exit /b %TOOL_EXIT_CODE%
)

endlocal