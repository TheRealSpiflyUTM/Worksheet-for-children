import { useState } from "react";
import { Button, Modal, Input, Popconfirm, Popover, Flex, message } from "antd";
import { EditOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import "./Menu.css";

const PAGE_TITLE = "Clasele Mele";
const ADD_BUTTON_LABEL = "Adauga Clase";
const EMPTY_TEXT = "Nu este nimic acum.";

const INITIAL_CLASSES = [
  { id: 1, name: "Floricica", members: 14 },
  { id: 2, name: "Fluture Mare", members: 24 },
  { id: 3, name: "Ceva acolo", members: 21 },
];

const NEW_CLASS_MEMBERS = 0;

function MenuClass() {
  const [classes, setClasses] = useState(INITIAL_CLASSES);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingId, setEditingId] = useState(null);
  const [nameInput, setNameInput] = useState("");

  function openAddModal() {
    setModalMode("add");
    setEditingId(null);
    setNameInput("");
    setIsModalOpen(true);
  }

  function openRenameModal(c) {
    setModalMode("rename");
    setEditingId(c.id);
    setNameInput(c.name);
    setIsModalOpen(true);
  }

  function handleModalCancel() {
    setIsModalOpen(false);
    setNameInput("");
  }

  function handleModalOk() {
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      message.error("Nu poate sa fie gol");
      return;
    }

    if (modalMode === "add") {
      setClasses(function (current) {
        const nextId = current.length
          ? Math.max.apply(
              null,
              current.map(function (c) {
                return c.id;
              })
            ) + 1
          : 1;

        return current.concat([
          {
            id: nextId,
            name: trimmedName,
            members: NEW_CLASS_MEMBERS,
          },
        ]);
      });
    } else {
      setClasses(function (current) {
        return current.map(function (c) {
          if (c.id === editingId) {
            return { ...c, name: trimmedName };
          }
          return c;
        });
      });
    }

    setIsModalOpen(false);
    setNameInput("");
  }

  function handleDeleteClass(id) {
    setClasses(function (current) {
      return current.filter(function (c) {
        return c.id !== id;
      });
    });
  }

  function handleNameInputChange(e) {
    setNameInput(e.target.value);
  }

  return (
    <section className="class-menu">
      <div className="class-menu__header">
        <h2 className="class-menu__title">{PAGE_TITLE}</h2>

        <Button type="primary" onClick={openAddModal}>
          {ADD_BUTTON_LABEL}
        </Button>
      </div>

      {classes.length === 0 ? (
        <p className="class-menu__empty">{EMPTY_TEXT}</p>
      ) : (
        <div className="class-menu__grid">
          {classes.map(function (c) {
            const menuContent = (
              <Flex gap="small">
                <Button
                  size="small"
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={function (e) {
                    e.stopPropagation();
                    openRenameModal(c);
                  }}
                >
                  Rename
                </Button>

                <Popconfirm
                  title="Delete this class?"
                  onConfirm={function (e) {
                    if (e) {
                      e.stopPropagation();
                    }
                    handleDeleteClass(c.id);
                  }}
                  onCancel={function (e) {
                    if (e) {
                      e.stopPropagation();
                    }
                  }}
                  okText="Delete"
                  cancelText="Cancel"
                >
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={function (e) {
                      e.stopPropagation();
                    }}
                  >
                    Delete
                  </Button>
                </Popconfirm>
              </Flex>
            );

            return (
              <div key={c.id} className="class-tile">
                <Popover
                  content={menuContent}
                  trigger="click"
                  placement="bottomRight"
                >
                  <Button
                    className="class-tile__menu-trigger"
                    size="small"
                    type="text"
                    icon={<MoreOutlined />}
                    onClick={function (e) {
                      e.stopPropagation();
                    }}
                  />
                </Popover>

                <span className="class-tile__name">{c.name}</span>
                <span className="class-tile__members">{c.members} members</span>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        title={modalMode === "add" ? "Clasa noua" : "Renumeste"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={modalMode === "add" ? "Create" : "Save"}
      > 
        <Input
          placeholder="Class name"
          value={nameInput}
          onChange={handleNameInputChange}
          onPressEnter={handleModalOk}
          autoFocus
        />
      </Modal>
    </section>
  );
}

export default MenuClass;