import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { ResponsiveGrid } from '../components/layout/ResponsiveGrid';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { AlertBanner } from '../components/feedback/AlertBanner';
import { Radio, Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <PageContainer maxWidth="wide">
      <PageHeader
        title="Settings"
        subtitle="Configure mine geotechnical parameters, LoRa gateway frequency channels, and alert thresholds."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save size={14} />}
            disabled
            title="Gateway hardware parameters are firmware-configured (🟡 TBD per ADR D-026/D-028)"
          >
            Save Changes
          </Button>
        }
      />

      {/* HARDWARE CONFIGURATION DISCLAIMER BANNER */}
      <div style={{ marginBottom: '16px' }}>
        <AlertBanner
          severity="info"
          title="Hardware & Gateway Configuration (🟡 TBD)"
          message="LoRa physical frequency parameters and RF transmission power are provisioned directly on the hardware gateway and node firmware (ADR D-026). Server-side safety rules are managed via the Phase 6 rules engine (/api/v1/rules)."
        />
      </div>

      <ResponsiveGrid columns={2} gap="md">
        <Card
          title="LoRa Gateway Parameters"
          subtitle="Mother System communication channel & power"
          icon={<Radio size={18} />}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Select
              label="Radio Frequency Band"
              options={[
                { value: '868', label: '868.1 MHz (Europe / Standard Mining)' },
                { value: '433', label: '433.0 MHz (Ultra Sub-GHz Long Penetration)' },
                { value: '915', label: '915.0 MHz (US / Americas)' },
              ]}
              defaultValue="868"
            />
            <Input
              label="Spreading Factor (SF)"
              defaultValue="SF10"
              helperText="Tradeoff between LoRa transmission range and packet latency"
            />
            <Input
              label="Transmission Power (Tx)"
              defaultValue="14"
              suffix="dBm"
              helperText="Output power for subterranean gateway transmission"
            />
          </div>
        </Card>

        <Card
          title="Safety Thresholds"
          subtitle="Autonomous advisory escalation limits"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input
              label="Deformation Velocity Limit"
              defaultValue="0.50"
              suffix="mm / hr"
              helperText="Triggers advisory warning on single-sensor crack widening"
            />
            <Input
              label="Critical Tilt Anomaly"
              defaultValue="2.00"
              suffix="deg"
              helperText="Immediate safety warning threshold for MPU6500 angle change"
            />
            <Input
              label="Hazardous Gas Methane Limit"
              defaultValue="500"
              suffix="ppm"
              helperText="Triggers immediate ventilation alert and sector warning"
            />
          </div>
        </Card>
      </ResponsiveGrid>
    </PageContainer>
  );
};
