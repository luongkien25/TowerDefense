import type { ReactNode } from 'react';
import { Coins, Hammer, Shield, Trash2, Wand2, X } from 'lucide-react';

import {
  getBlockerRepairCost,
  getBlockerUpgradeCost,
  getTowerUpgradeCost,
  MAX_BLOCKER_LEVEL,
  MAX_TOWER_LEVEL,
} from '../../game/constants';
import type {
  BlockerShopItem,
  BuildItemType,
  BuildShopItem,
  GameStatus,
  PlacedBlocker,
  PlacedTower,
  TowerShopItem,
} from '../../game/types';

interface TowerShopPanelProps {
  blocker: BlockerShopItem;
  coins: number;
  enemyCount: number;
  health: number;
  maxWaves: number;
  onClearSelection: () => void;
  onRepairBlocker: () => void;
  onResetGame: () => void;
  onSelectItem: (item: BuildShopItem) => void;
  onSellBlocker: () => void;
  onSellTower: () => void;
  onStartWave: () => void;
  onUpgradeBlocker: () => void;
  onUpgradeTower: () => void;
  selectedBlocker: PlacedBlocker | undefined;
  selectedBuildType: BuildItemType | null;
  selectedTower: PlacedTower | undefined;
  status: GameStatus;
  towers: TowerShopItem[];
  wave: number;
}

export function TowerShopPanel({
  blocker,
  coins,
  enemyCount,
  health,
  maxWaves,
  onClearSelection,
  onRepairBlocker,
  onResetGame,
  onSelectItem,
  onSellBlocker,
  onSellTower,
  onStartWave,
  onUpgradeBlocker,
  onUpgradeTower,
  selectedBlocker,
  selectedBuildType,
  selectedTower,
  status,
  towers,
  wave,
}: TowerShopPanelProps) {
  const shopItems: BuildShopItem[] = [...towers, blocker];
  const canStartWave = enemyCount === 0 && health > 0 && status === 'playing' && wave <= maxWaves;

  return (
    <div className="w-80 bg-gradient-to-b from-slate-800 to-slate-950 border-l-2 border-amber-500/50 p-4 overflow-y-auto">
      {(selectedTower || selectedBlocker) && (
        <SelectionPanel
          coins={coins}
          onClearSelection={onClearSelection}
          onRepairBlocker={onRepairBlocker}
          onSellBlocker={onSellBlocker}
          onSellTower={onSellTower}
          onUpgradeBlocker={onUpgradeBlocker}
          onUpgradeTower={onUpgradeTower}
          selectedBlocker={selectedBlocker}
          selectedTower={selectedTower}
        />
      )}

      <h3 className="text-2xl font-bold text-amber-400 mb-4 text-center border-b-2 border-amber-500 pb-2">
        Xây Dựng
      </h3>

      <div className="space-y-3">
        {shopItems.map((item) => (
          <button
            key={item.type}
            onClick={() => onSelectItem(item)}
            className={`w-full bg-gradient-to-r border-2 rounded-lg p-4 transition-all duration-300 ${
              selectedBuildType === item.type
                ? 'from-green-700 to-green-800 border-green-300'
                : 'from-slate-700 to-slate-800 hover:from-amber-600 hover:to-amber-700 border-amber-500/50 hover:border-amber-400'
            } ${coins < item.cost ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={health <= 0 || status !== 'playing'}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{item.icon}</span>

                <div className="text-left">
                  <p className="text-white font-bold text-lg leading-tight">{item.name}</p>

                  <div className="flex items-center gap-1 text-yellow-400">
                    <Coins className="w-4 h-4" />
                    <span className="font-semibold">{item.cost}</span>
                  </div>

                  <p className="text-xs text-gray-300 mt-1 leading-snug">{getItemStats(item)}</p>
                </div>
              </div>

              {coins >= item.cost && (
                <div className="bg-green-500 text-white px-3 py-1 rounded-md text-sm font-bold">
                  {selectedBuildType === item.type ? 'Đang chọn' : 'Chọn'}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onStartWave}
        disabled={!canStartWave}
        className={`w-full mt-6 text-white px-6 py-4 rounded-lg font-bold text-xl shadow-xl transition-all duration-300 border-2 ${
          canStartWave
            ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-red-400'
            : 'bg-gray-600 border-gray-500 cursor-not-allowed opacity-60'
        }`}
      >
        {getWaveButtonLabel(enemyCount, status, wave, maxWaves)}
      </button>

      <button
        onClick={onResetGame}
        className="w-full mt-3 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-bold border-2 border-slate-500"
      >
        Chơi lại
      </button>
    </div>
  );
}

interface SelectionPanelProps {
  coins: number;
  onClearSelection: () => void;
  onRepairBlocker: () => void;
  onSellBlocker: () => void;
  onSellTower: () => void;
  onUpgradeBlocker: () => void;
  onUpgradeTower: () => void;
  selectedBlocker: PlacedBlocker | undefined;
  selectedTower: PlacedTower | undefined;
}

function SelectionPanel({
  coins,
  onClearSelection,
  onRepairBlocker,
  onSellBlocker,
  onSellTower,
  onUpgradeBlocker,
  onUpgradeTower,
  selectedBlocker,
  selectedTower,
}: SelectionPanelProps) {
  if (selectedTower) {
    const upgradeCost = getTowerUpgradeCost(selectedTower);
    const sellRefund = Math.floor(selectedTower.totalInvested * 0.65);
    const canUpgrade = selectedTower.level < MAX_TOWER_LEVEL;

    return (
      <div className="mb-4 rounded-lg border-2 border-amber-500/60 bg-slate-900/80 p-4">
        <PanelHeader title="Tháp đang chọn" onClearSelection={onClearSelection} />
        <div className="text-sm text-gray-200 space-y-1">
          <p>Cấp {selectedTower.level}/{MAX_TOWER_LEVEL}</p>
          <p>DMG {selectedTower.damage} | Range {selectedTower.range} | Tốc {selectedTower.fireRate}/s</p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <ActionButton
            disabled={!canUpgrade || coins < upgradeCost}
            icon={<Wand2 className="w-4 h-4" />}
            label={canUpgrade ? `Nâng ${upgradeCost}` : 'Tối đa'}
            onClick={onUpgradeTower}
          />
          <ActionButton
            icon={<Trash2 className="w-4 h-4" />}
            label={`Bán ${sellRefund}`}
            onClick={onSellTower}
            tone="danger"
          />
        </div>
      </div>
    );
  }

  if (selectedBlocker) {
    const upgradeCost = getBlockerUpgradeCost(selectedBlocker);
    const repairCost = getBlockerRepairCost(selectedBlocker);
    const sellRefund = Math.floor(selectedBlocker.totalInvested * 0.5);
    const canUpgrade = selectedBlocker.level < MAX_BLOCKER_LEVEL;
    const hpPercent = Math.max(0, Math.round((selectedBlocker.hp / selectedBlocker.maxHp) * 100));

    return (
      <div className="mb-4 rounded-lg border-2 border-amber-500/60 bg-slate-900/80 p-4">
        <PanelHeader title="Vật chặn đang chọn" onClearSelection={onClearSelection} />
        <div className="text-sm text-gray-200 space-y-1">
          <p>Cấp {selectedBlocker.level}/{MAX_BLOCKER_LEVEL}</p>
          <p>HP {Math.ceil(selectedBlocker.hp)}/{selectedBlocker.maxHp} ({hpPercent}%)</p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <ActionButton
            disabled={repairCost <= 0 || coins < repairCost}
            icon={<Hammer className="w-4 h-4" />}
            label={repairCost > 0 ? `Sửa ${repairCost}` : 'Đầy HP'}
            onClick={onRepairBlocker}
          />
          <ActionButton
            disabled={!canUpgrade || coins < upgradeCost}
            icon={<Shield className="w-4 h-4" />}
            label={canUpgrade ? `Gia cố ${upgradeCost}` : 'Tối đa'}
            onClick={onUpgradeBlocker}
          />
          <div className="col-span-2">
            <ActionButton
              icon={<Trash2 className="w-4 h-4" />}
              label={`Bán ${sellRefund}`}
              onClick={onSellBlocker}
              tone="danger"
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function PanelHeader({
  title,
  onClearSelection,
}: {
  title: string;
  onClearSelection: () => void;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h4 className="font-bold text-amber-300">{title}</h4>
      <button
        onClick={onClearSelection}
        className="rounded-md bg-slate-800 p-1 text-slate-200 hover:bg-slate-700"
        aria-label="Bỏ chọn"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function ActionButton({
  disabled = false,
  icon,
  label,
  onClick,
  tone = 'normal',
}: {
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  tone?: 'normal' | 'danger';
}) {
  const color =
    tone === 'danger'
      ? 'bg-red-700 hover:bg-red-600 border-red-500'
      : 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-bold text-white ${color} ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function getWaveButtonLabel(enemyCount: number, status: GameStatus, wave: number, maxWaves: number) {
  if (enemyCount > 0) return 'Wave đang chạy';
  if (status === 'victory') return 'Đã thắng màn';
  if (status === 'defeat') return 'Thành đã thất thủ';
  if (wave > maxWaves) return 'Đã hết wave';
  return `Bắt đầu Wave ${wave}/${maxWaves}`;
}

function getItemStats(item: BuildShopItem) {
  if (item.type === 'roadBlocker') {
    return `HP ${item.maxHp} | Đặt trên đường`;
  }

  return `DMG ${item.damage} | Range ${item.range}`;
}
