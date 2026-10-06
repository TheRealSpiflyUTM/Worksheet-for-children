import { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Dropdown, Input, Tooltip } from "antd";
import {
  ArrowLeftOutlined,
  EyeOutlined,
  MoreOutlined,
  SaveOutlined,
  ShareAltOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { EditorHeaderContext } from "../Leftsidebar/EditorHeaderContext.js";
import { LanguageButton } from "../platform/PlatformPages.jsx";
import { usePlatform } from "../platform/PlatformState.js";

export default function WorksheetToolbar({
  name,
  onNameChange,
  dirty,
  saving,
  hasGames,
  canUndo,
  onSave,
  onShare,
  onUndo,
  onPreview,
  previewing,
  onBack,
}) {
  const target = useContext(EditorHeaderContext);
  const { t } = usePlatform();
  const [menuOpen, setMenuOpen] = useState(false);
  if (!target) return null;
  const actions = [
    {
      key: "undo",
      label: t("Undo removal"),
      icon: <UndoOutlined aria-hidden="true" />,
      disabled: !canUndo || saving || previewing,
      onClick: onUndo,
    },
    {
      key: "preview",
      label: t(previewing ? "Back to editor" : "Preview as child"),
      icon: previewing ? (
        <ArrowLeftOutlined aria-hidden="true" />
      ) : (
        <EyeOutlined aria-hidden="true" />
      ),
      disabled: !hasGames || saving,
      onClick: previewing ? onBack : onPreview,
    },
    {
      key: "share",
      label: t("Share worksheet"),
      icon: <ShareAltOutlined aria-hidden="true" />,
      disabled: dirty || saving || !hasGames || previewing,
      onClick: onShare,
    },
  ];
  const save = (
    <Button
      className="saveWorksheetButton"
      type="primary"
      icon={<SaveOutlined aria-hidden="true" />}
      loading={saving}
      disabled={!dirty}
      onClick={onSave}
      aria-label={t("Save worksheet")}
    >
      <span className="worksheetSaveLabelFull">{t("Save worksheet")}</span>
      <span className="worksheetSaveLabelCompact">{t("Save")}</span>
    </Button>
  );
  return createPortal(
    <div
      className="worksheetToolbar"
      role="group"
      aria-label={t("Worksheet tools")}
      aria-busy={saving}
    >
      <div className="worksheetNameField">
        <Input
          id="worksheet-name"
          aria-label={t("Worksheet name")}
          value={name}
          maxLength={150}
          disabled={saving || previewing}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </div>
      <div className="worksheetToolbarExpanded">
        {actions.map((action) =>
          action.key === "undo" ? (
            <Tooltip key={action.key} title={action.label}>
              <Button
                icon={action.icon}
                aria-label={action.label}
                disabled={action.disabled}
                onClick={action.onClick}
              />
            </Tooltip>
          ) : (
            <Button
              key={action.key}
              icon={action.icon}
              disabled={action.disabled}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ),
        )}
        {save}
        <LanguageButton inline />
      </div>
      <div className="worksheetToolbarCompact">
        {save}
        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          open={menuOpen}
          onOpenChange={setMenuOpen}
          menu={{ items: actions, onClick: () => setMenuOpen(false) }}
          popupRender={(menu) => (
            <div className="worksheetToolbarPopup">
              {menu}
              <div className="worksheetToolbarLanguage">
                <LanguageButton inline />
              </div>
            </div>
          )}
        >
          <Button
            icon={<MoreOutlined aria-hidden="true" />}
            aria-label={t("More actions")}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          />
        </Dropdown>
      </div>
    </div>,
    target,
  );
}
