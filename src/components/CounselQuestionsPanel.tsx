import { CirclePlus, MessageSquareText, Trash2 } from "lucide-react";
import type { CounselQuestion, CounselQuestionStatus } from "../lib/counselQuestions";

type CounselQuestionsPanelProps = {
  questions: CounselQuestion[];
  onAddQuestion: () => void;
  onUpdateQuestion: (id: string, updates: Partial<CounselQuestion>) => void;
  onRemoveQuestion: (id: string) => void;
};

const statuses: CounselQuestionStatus[] = ["open", "answered", "deferred"];
const priorities: CounselQuestion["priority"][] = ["P0", "P1", "P2"];

export function CounselQuestionsPanel({
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion
}: CounselQuestionsPanelProps) {
  return (
    <section className="review-section counsel-questions">
      <div className="panel-title compact-title split-title">
        <div>
          <MessageSquareText size={17} aria-hidden="true" />
          <h3>Counsel Questions</h3>
        </div>
        <button type="button" className="secondary" onClick={onAddQuestion}>
          <CirclePlus size={16} aria-hidden="true" />
          Add question
        </button>
      </div>
      <p className="section-note">
        Editable audit-prep prompts for counsel review. AI-generated questions remain drafts and do not create legal conclusions.
      </p>
      <div className="question-list">
        {questions.length === 0 ? <p className="empty-state">No counsel questions generated for current project facts.</p> : null}
        {questions.map((question, index) => (
          <article key={question.id} className={`question-editor ${question.source}`}>
            <div className="question-editor-header">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{question.source}</strong>
              <small>{question.relatedFlagId ?? "general"}</small>
            </div>
            <div className="question-editor-grid">
              <div className="editor-field question-text-field">
                <label className="field-label" htmlFor={`question-${index + 1}-text`}>
                  Question {String(index + 1).padStart(2, "0")} text
                </label>
                <textarea
                  id={`question-${index + 1}-text`}
                  aria-label={`Question ${String(index + 1).padStart(2, "0")} text`}
                  value={question.question}
                  onChange={(event) => onUpdateQuestion(question.id, { question: event.target.value })}
                />
              </div>
              <div className="editor-field">
                <label className="field-label" htmlFor={`question-${index + 1}-status`}>
                  Question {String(index + 1).padStart(2, "0")} status
                </label>
                <select
                  id={`question-${index + 1}-status`}
                  aria-label={`Question ${String(index + 1).padStart(2, "0")} status`}
                  value={question.status}
                  onChange={(event) => onUpdateQuestion(question.id, { status: event.target.value as CounselQuestionStatus })}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="editor-field">
                <label className="field-label" htmlFor={`question-${index + 1}-priority`}>
                  Question {String(index + 1).padStart(2, "0")} priority
                </label>
                <select
                  id={`question-${index + 1}-priority`}
                  value={question.priority}
                  onChange={(event) => onUpdateQuestion(question.id, { priority: event.target.value as CounselQuestion["priority"] })}
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="danger"
                onClick={() => onRemoveQuestion(question.id)}
                aria-label={`Remove question ${index + 1}`}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
            <small>{question.notLegalAdviceBoundary}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
