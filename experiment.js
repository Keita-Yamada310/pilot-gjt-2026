const jsPsych = initJsPsych({
  show_progress_bar: true,
  auto_update_progress_bar: false,
  on_finish: async function() {
    // Saving is handled in the final trial.
  }
});

const sessionId = jsPsych.randomization.randomID(10);
const startTimestamp = new Date().toISOString();

jsPsych.data.addProperties({
  session_id: sessionId,
  study: "pilot_gjt_30",
  jspsych_version: "8.2.3",
  session_start_iso: startTimestamp,
  user_agent: navigator.userAgent,
  screen_width: window.screen.width,
  screen_height: window.screen.height
});

const timeline = [];

const participantForm = {
  type: jsPsychSurveyHtmlForm,
  preamble: `
    <div class="gjt-card">
      <h2>6段階英文判断課題</h2>
      <p>担当者から指定された参加者番号を入力してください。</p>
    </div>`,
  html: `
    <p>
      <label for="participant_id"><strong>参加者番号：</strong></label>
      <input id="participant_id" name="participant_id"
             type="text" required autocomplete="off"
             pattern="[A-Za-z0-9_-]{1,30}">
    </p>`,
  button_label: "次へ",
  data: { phase: "participant_info" },
  on_finish: function(data) {
    const pid = String(data.response.participant_id || "").trim();
    jsPsych.data.addProperties({ participant_id: pid });
  }
};
timeline.push(participantForm);

timeline.push({
  type: jsPsychInstructions,
  pages: [
    `<div class="gjt-card">
      <h2>説明</h2>
      <p>画面に英文が1文ずつ表示されます。</p>
      <p>その英文が、英語としてどの程度文法的だと思うかを判断してください。</p>
      <p><strong>1 = 明らかに非文法的</strong><br>
         <strong>6 = 明らかに文法的</strong></p>
      <p>各文は10秒以内に判断してください。</p>
    </div>`,
    `<div class="gjt-card">
      <h2>回答上の注意</h2>
      <p>文の内容が好きかどうかではなく、英語としての文法性を判断してください。</p>
      <p>迷った場合も、最も近い数字を1つ選んでください。</p>
      <p>最初に練習を2問行い、その後30問の本課題に進みます。</p>
    </div>`
  ],
  show_clickable_nav: true,
  button_label_previous: "戻る",
  button_label_next: "次へ",
  data: { phase: "instructions" }
});

timeline.push({
  type: jsPsychFullscreen,
  fullscreen_mode: true,
  message: `<div class="gjt-card"><p>「開始」を押すと全画面表示になります。</p></div>`,
  button_label: "開始",
  data: { phase: "fullscreen_start" }
});

const practiceItems = [
  {
    sentence: "The girl waited for the bus.",
    expected_status: "grammatical",
    practice_id: "P1"
  },
  {
    sentence: "The boy enjoyed to play football.",
    expected_status: "ungrammatical",
    practice_id: "P2"
  }
];

function makeJudgmentTrial(isPractice = false) {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
      const sentence = isPractice
        ? jsPsych.evaluateTimelineVariable("sentence")
        : jsPsych.evaluateTimelineVariable("sentence");
      const progress = isPractice
        ? "練習"
        : `本課題 ${jsPsych.evaluateTimelineVariable("display_number")} / 30`;
      return `
        <div class="gjt-card">
          <div class="gjt-progress">${progress}</div>
          <div class="gjt-sentence">${sentence}</div>
          <div class="gjt-label-row">
            <span>1　明らかに非文法的</span>
            <span>6　明らかに文法的</span>
          </div>
          <div class="timeout-note">10秒以内に1つ選んでください。</div>
        </div>`;
    },
    choices: ["1", "2", "3", "4", "5", "6"],
    button_html: function(choice, choiceIndex) {
      return `<button class="jspsych-btn" data-choice="${choiceIndex}">${choice}</button>`;
    },
    trial_duration: TRIAL_DURATION_MS,
    response_ends_trial: true,
    css_classes: ["gjt-scale"],
    data: function() {
      if (isPractice) {
        return {
          phase: "practice",
          practice_id: jsPsych.evaluateTimelineVariable("practice_id"),
          sentence_text: jsPsych.evaluateTimelineVariable("sentence"),
          presented_status: jsPsych.evaluateTimelineVariable("expected_status")
        };
      }
      return {
        phase: "gjt",
        item_id: jsPsych.evaluateTimelineVariable("item_id"),
        category: jsPsych.evaluateTimelineVariable("category"),
        target_verb: jsPsych.evaluateTimelineVariable("verb"),
        target_pattern: jsPsych.evaluateTimelineVariable("pattern"),
        corpus_frequency: jsPsych.evaluateTimelineVariable("corpus_frequency"),
        sentence_text: jsPsych.evaluateTimelineVariable("sentence"),
        presented_status: jsPsych.evaluateTimelineVariable("presented_status"),
        error_type: jsPsych.evaluateTimelineVariable("error_type")
      };
    },
    on_finish: function(data) {
      data.rating = data.response === null ? null : Number(data.response) + 1;
      data.timed_out = data.response === null;
      data.response_label = data.rating;
    }
  };
}

timeline.push({
  timeline: [makeJudgmentTrial(true)],
  timeline_variables: practiceItems,
  randomize_order: false
});

timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="gjt-card">
      <h2>練習終了</h2>
      <p>ここから本課題30問です。</p>
      <p>提示順は参加者ごとにランダムです。</p>
    </div>`,
  choices: ["本課題を始める"],
  data: { phase: "practice_end" }
});

const randomizedItems = jsPsych.randomization.shuffle(GJT_ITEMS).map((item, index) => ({
  ...item,
  display_number: index + 1
}));

timeline.push({
  timeline: [makeJudgmentTrial(false)],
  timeline_variables: RANDOMIZE_ITEMS ? randomizedItems : GJT_ITEMS.map((x, i) => ({...x, display_number: i + 1})),
  randomize_order: false
});

timeline.push({
  type: jsPsychFullscreen,
  fullscreen_mode: false,
  data: { phase: "fullscreen_end" }
});

async function saveToDataPipe(csvText, filename) {
  const response = await fetch("https://pipe.jspsych.org/api/data/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      experimentID: DATAPIPE_EXPERIMENT_ID,
      filename: filename,
      data: csvText
    })
  });

  const result = await response.json();
  if (!response.ok || result.error) {
    throw new Error(result.message || `HTTP ${response.status}`);
  }
  return result;
}

timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `<div class="gjt-card save-message"><p>回答を保存しています。画面を閉じないでください。</p></div>`,
  choices: [],
  trial_duration: 250,
  data: { phase: "saving_start" },
  on_finish: async function() {
    const participantId = jsPsych.data.get().values()
      .find(x => x.participant_id)?.participant_id || "unknown";
    const safePid = participantId.replace(/[^A-Za-z0-9_-]/g, "_");
    const filename = `pilot_gjt_${safePid}_${sessionId}.csv`;

    jsPsych.data.addProperties({
      session_end_iso: new Date().toISOString()
    });

    const csvText = jsPsych.data.get().csv();

    let saveStatus = "local_download";
    let saveMessage = "";

    if (DATAPIPE_EXPERIMENT_ID.trim() !== "") {
      try {
        await saveToDataPipe(csvText, filename);
        saveStatus = "datapipe_success";
        saveMessage = "回答は正常に保存されました。";
      } catch (error) {
        console.error("DataPipe save failed:", error);
        jsPsych.data.get().localSave("csv", filename);
        saveStatus = "datapipe_failed_local_backup";
        saveMessage = "オンライン保存に失敗したため、CSVをこのPCに保存しました。担当者を呼んでください。";
      }
    } else {
      jsPsych.data.get().localSave("csv", filename);
      saveMessage = "CSVをこのPCに保存しました。";
    }

    jsPsych.data.write({
      phase: "save_result",
      save_status: saveStatus,
      filename: filename
    });

    document.body.innerHTML = `
      <div id="jspsych-content" class="jspsych-content">
        <div class="gjt-card save-message">
          <h2>終了</h2>
          <p>${saveMessage}</p>
          <p>ご協力ありがとうございました。</p>
        </div>
      </div>`;
  }
});

jsPsych.run(timeline);
