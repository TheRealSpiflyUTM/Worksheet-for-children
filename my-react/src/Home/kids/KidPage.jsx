import { useParams } from "react-router-dom";
import { Button, Card, ConfigProvider, Flex, List, Typography } from "antd";
import "../Menu.css";
import "../ClassPage.css";
import "./KidPage.css";

const { Title } = Typography;

const EMPTY_TEXT = "Nu-i nimic aici";
const NO_DATA = "-";

const TESTS = [
  { id: 1, name: "Easy Math", percent: 80, date: "2026-09-20" },
  { id: 2, name: "Number Sequence", percent: 60, date: "2026-09-24" },
  { id: 3, name: "Odd or Even", percent: null, date: null },
];

function formatPercent(percent) {
  return percent === null || percent === undefined ? NO_DATA : percent + "%";
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString("ro") : NO_DATA;
}

function KidPage() {
  const params = useParams();
  const kidName = params.kidName;

  function renderTest(t) {
    return (
      <List.Item key={t.id} className="student-list-item">
        <Card className="student-block" size="small">
          <div className="test-grid">
            <Button type="text" className="table-button student-name-button">
              {t.name}
            </Button>

            <Button type="text" className="table-button">
              {formatPercent(t.percent)}
            </Button>

            <Button type="text" className="table-button">
              {formatDate(t.date)}
            </Button>

            <span />
          </div>
        </Card>
      </List.Item>
    );
  }

  return (
    <section className="class-menu">
      <ConfigProvider
        theme={{
          components: {
            Button: {
              colorText: "var(--cm-text)",
              colorTextHover: "var(--cm-hover)",
              borderRadius: 8,
            },
          },
        }}
      >
        <Card>
          <Flex justify="space-between" align="center" gap="middle" wrap>
            <Title level={2} style={{ margin: 0 }}>
              {kidName}
            </Title>
          </Flex>

          {TESTS.length > 0 && (
            <div className="test-grid student-head">
              <Button type="text" className="table-button">
                Test Name
              </Button>

              <Button type="text" className="table-button">
                Result
              </Button>

              <Button type="text" className="table-button">
                Date
              </Button>

              <span />
            </div>
          )}

          <List
            split={false}
            dataSource={TESTS}
            locale={{ emptyText: EMPTY_TEXT }}
            renderItem={renderTest}
          />
        </Card>
      </ConfigProvider>
    </section>
  );
}

export default KidPage;