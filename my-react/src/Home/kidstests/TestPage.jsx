import { useParams } from "react-router-dom";
import { Button, Card, ConfigProvider, Flex, List, Typography } from "antd";
import "../Menu.css";
import "../ClassPage.css";
import "../kids/KidPage.css";

const { Title } = Typography;

const EMPTY_TEXT = "Nu-i nimic aici";
const NO_DATA = "-";

// Temporary data: replace with your real test/question data
const TEST_NAMES = {
  1: "Easy Math",
  2: "Number Sequence",
  3: "Odd or Even",
};

const QUESTIONS_BY_TEST = {
  1: [
    { id: 1, name: "ColorMiniGame", score: 10, maxScore: 10 },
    { id: 2, name: "CountingMiniGame", score: 6, maxScore: 10 },
  ],
  2: [{ id: 1, name: "SequenceMiniGame", score: 6, maxScore: 10 }],
  3: [{ id: 1, name: "OddEvenMiniGame", score: null, maxScore: 10 }],
};

function formatScore(q) {
  return q.score === null || q.score === undefined
    ? NO_DATA
    : q.score + " / " + q.maxScore;
}

function TestPage() {
  const params = useParams();
  const testId = params.testId;

  const testName = TEST_NAMES[testId] || "Test";
  const questions = QUESTIONS_BY_TEST[testId] || [];

  function renderQuestion(q, index) {
    return (
      <List.Item key={q.id} className="student-list-item">
        <Card className="student-block" size="small">
          <div className="question-grid">
            <Button type="text" className="table-button student-name-button">
              {"Question " + (index + 1)}
            </Button>

            <Button type="text" className="table-button">
              {q.name}
            </Button>

            <Button type="text" className="table-button">
              {formatScore(q)}
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
              {testName}
            </Title>
          </Flex>

          {questions.length > 0 && (
            <div className="question-grid student-head">
              <Button type="text" className="table-button">
                Question
              </Button>

              <Button type="text" className="table-button">
                Name
              </Button>

              <Button type="text" className="table-button">
                Score
              </Button>

              <span />
            </div>
          )}

          <List
            split={false}
            dataSource={questions}
            locale={{ emptyText: EMPTY_TEXT }}
            renderItem={renderQuestion}
          />
        </Card>
      </ConfigProvider>
    </section>
  );
}

export default TestPage;