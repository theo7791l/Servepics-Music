
import React from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isElectronEnvironment } from '@/utils/audioPlayer';

interface BrowserCompatibilityWarningProps {
  onClose?: () => void;
}

const BrowserCompatibilityWarning: React.FC<BrowserCompatibilityWarningProps> = ({ onClose }) => {
  if (isElectronEnvironment()) {
    return null; // Ne pas afficher dans Electron
  }

  return (
    <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-yellow-500 mt-0.5" size={20} />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-200 mb-1">
            Limitation du navigateur web
          </h3>
          <p className="text-xs text-yellow-100/80 mb-3">
            La lecture audio est limitée dans le navigateur web à cause des restrictions CORS. 
            Pour une expérience complète, utilisez l'application Electron.
          </p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs border-yellow-500/50 text-yellow-200"
              onClick={() => window.open('https://github.com/electron/electron/releases', '_blank')}
            >
              <Download size={14} className="mr-1" />
              Télécharger Electron
            </Button>
            {onClose && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-xs text-yellow-200"
                onClick={onClose}
              >
                Compris
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserCompatibilityWarning;
