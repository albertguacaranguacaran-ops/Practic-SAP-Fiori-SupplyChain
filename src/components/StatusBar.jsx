import { useState, useEffect } from 'react';
import {
    CheckCircle, AlertTriangle, XCircle, Info,
    Clock, Database, User
} from 'lucide-react';

const STATUS_TYPES = {
    success: { icon: CheckCircle, bg: 'bg-[#107E3E]', label: 'Éxito' },
    warning: { icon: AlertTriangle, bg: 'bg-[#E9730C]', label: 'Advertencia' },
    error: { icon: XCircle, bg: 'bg-[#BB0000]', label: 'Error' },
    info: { icon: Info, bg: 'bg-[#0854A0]', label: 'Info' },
    neutral: { icon: null, bg: 'bg-white text-[#32363A]', label: '' }
};

export default function StatusBar({
    message = '',
    type = 'neutral',
    selectedCount = 0,
    totalCount = 0,
    currentTransaction = '',
    user = 'CONSULTOR01'
}) {
    const [time, setTime] = useState(new Date());
    const [displayMessage, setDisplayMessage] = useState(message);
    const [displayType, setDisplayType] = useState(type);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-reset message after 5 seconds for non-neutral
    useEffect(() => {
        if (message && type !== 'neutral') {
            setDisplayMessage(message);
            setDisplayType(type);

            const timer = setTimeout(() => {
                setDisplayMessage('');
                setDisplayType('neutral');
            }, 5000);

            return () => clearTimeout(timer);
        } else {
            setDisplayMessage(message);
            setDisplayType(type);
        }
    }, [message, type]);

    const config = STATUS_TYPES[displayType] || STATUS_TYPES.neutral;
    const Icon = config.icon;

    return (
        <div className={`status-bar ${displayType !== 'neutral' ? config.bg + ' text-white' : ''}`}>
            {/* Left Section - Message */}
            <div className="flex items-center gap-2">
                {Icon && <Icon size={14} />}
                <span className="text-sm">
                    {displayMessage || (selectedCount > 0
                        ? `${selectedCount} de ${totalCount.toLocaleString()} material(es) seleccionado(s)`
                        : `Listo. ${totalCount.toLocaleString()} registros cargados.`
                    )}
                </span>
            </div>

            {/* Right Section - System Info */}
            <div className="flex items-center gap-4 text-xs">
                {currentTransaction && (
                    <div className="flex items-center gap-1">
                        <Database size={12} />
                        <span className="font-mono">{currentTransaction}</span>
                    </div>
                )}

                <div className="flex items-center gap-1">
                    <User size={12} />
                    <span>{user}</span>
                </div>

                <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>
                        {time.toLocaleDateString('es-VE')} {time.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <span className="font-semibold">SRV:</span>
                    <span className="text-[#107E3E]">●</span>
                    <span>DAKAFACIL-PRD</span>
                </div>
            </div>
        </div>
    );
}

// Helper hook for status messages
export function useStatusMessage() {
    const [status, setStatus] = useState({ message: '', type: 'neutral' });

    const showSuccess = (msg) => setStatus({ message: msg, type: 'success' });
    const showError = (msg) => setStatus({ message: msg, type: 'error' });
    const showWarning = (msg) => setStatus({ message: msg, type: 'warning' });
    const showInfo = (msg) => setStatus({ message: msg, type: 'info' });
    const clear = () => setStatus({ message: '', type: 'neutral' });

    return { status, showSuccess, showError, showWarning, showInfo, clear };
}
