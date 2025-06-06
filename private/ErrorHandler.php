<?php
class ErrorHandler {
    public static function handleError($errno, $errstr, $errfile, $errline) {
        if (!(error_reporting() & $errno)) {
            return false;
        }

        $errorType = self::getErrorType($errno);
        $logMessage = "$errorType: $errstr in $errfile on line $errline";
        error_log($logMessage);

        if (ini_get('display_errors')) {
            echo self::formatErrorMessage($errorType, $errstr, $errfile, $errline);
        }

        return true;
    }

    public static function handleException($exception) {
        $logMessage = "Uncaught Exception: " . $exception->getMessage() . " in " . $exception->getFile() . " on line " . $exception->getLine();
        error_log($logMessage);

        if (ini_get('display_errors')) {
            echo self::formatErrorMessage("Uncaught Exception", $exception->getMessage(), $exception->getFile(), $exception->getLine());
        } else {
            echo "An error occurred. Please try again later.";
        }
    }

    private static function getErrorType($errno) {
        return match ($errno) {
            E_ERROR => 'Error',
            E_WARNING => 'Warning',
            E_PARSE => 'Parse Error',
            E_NOTICE => 'Notice',
            E_CORE_ERROR => 'Core Error',
            E_CORE_WARNING => 'Core Warning',
            E_COMPILE_ERROR => 'Compile Error',
            E_COMPILE_WARNING => 'Compile Warning',
            E_USER_ERROR => 'User Error',
            E_USER_WARNING => 'User Warning',
            E_USER_NOTICE => 'User Notice',
            E_STRICT => 'Strict',
            E_RECOVERABLE_ERROR => 'Recoverable Error',
            E_DEPRECATED => 'Deprecated',
            E_USER_DEPRECATED => 'User Deprecated',
            default => 'Unknown error type'
        };
    }

    private static function formatErrorMessage($errorType, $message, $file, $line) {
        return "<div style='background-color: #ffcccc; border: 1px solid #ff0000; padding: 10px; margin: 10px;'>
            <strong>$errorType:</strong> $message<br>
            in <strong>$file</strong> on line <strong>$line</strong>
        </div>";
    }
}

set_error_handler([ErrorHandler::class, 'handleError']);
set_exception_handler([ErrorHandler::class, 'handleException']);