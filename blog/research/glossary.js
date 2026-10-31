'use strict';
const glossary = {
  'sample-context': {title:'试听样本',body:'使用相同文本与参考音色（女声 2）。音频为预生成精选样本，不代表整体成功率。'},
  'evaluation-context': {title:'评测设置',body:'6 个音色 × 20 句文本 × 4 种情感，共 480 条请求。每个系统保留一个代表配置，控制接口不完全相同。E2V 为公开 emotion2vec+ 的分类命中率。'},
  'sft': {title:'SFT · 监督微调',body:'给模型一个输入和一个合格答案，让它练习从输入预测答案。这里的输入是文字、标签与参考声音，答案是目标语音的离散码。它首先教会模型“这个控制条件对应什么声音”。'},
  'reference': {title:'参考音频',body:'用一小段录音告诉模型目标音色与发声特征，再配上这段录音的准确转写。生成新台词时，模型把它作为声音参考。参考中的情感与发声方式也可能影响结果。'},
  'teacher': {title:'教师模型 · 制作训练答案的模型',body:'这里指用来生成候选训练语音的已有模型。同一句文字和同一段参考声音，分别指定不同情感生成，再筛掉读错、音色偏离或情感不对的候选。通过筛选的语音才用来教 Iroha。'},
  'audio-tokens': {title:'离散语音码 · 声音的压缩表示',body:'语音 codec 把一小段声波压缩成几组离散编号。生成模型逐步预测这些编号，codec 的解码器再把它们还原成声波。编号不是文字，也不是音高或音量旋钮。'},
  'slow': {title:'Slow model · 跨时间生成的主干',body:'在 Fish 的结构里，它按时间顺序预测每帧的语义码，并把隐状态交给 fast model。文本、参考音和已生成的历史共同影响预测。“Slow”是架构中的名称，不表示说话语速慢。'},
  'fast': {title:'Fast model · 补齐一帧的声学信息',body:'根据 slow model 的隐状态，继续预测当前帧的九个残差码。残差码补充压缩表示中剩余的声学细节。两部分一起决定最终声音；不能把它简单等同于一个独立的音色模块。'},
  'lora': {title:'LoRA · 用少量新增参数适配模型',body:'在原有线性层旁添加一个较小的可训练更新。训练时主要调整这个更新，之后可合并到原权重中。rank 决定更新的容量，alpha 用来缩放它；它们不是情感强弱参数。'},
  'grpo': {title:'GRPO · 比较同一请求的多次尝试',body:'同一个请求生成多个候选，再根据自动奖励比较它们在组内的相对表现。训练倾向于提高较好候选的概率。这里每组有八个候选，但奖励只能反映检测器检查的维度，不能替代人的整体听感。'},
  'kl': {title:'KL 约束 · 限制模型改得太远',body:'训练中惩罚当前模型的预测分布过度偏离 SFT 参考模型。这样可以减轻追逐奖励时破坏已有能力的风险。权重更大不必然更好，仍要实测表达能力与音色之间的取舍。'},
  'beats': {title:'BEATs 事件检测器',body:'基于通用音频表征训练的检测器，用来判断片段中是否出现哭声或耳语等发声方式。它识别声音事件，不负责判断台词读对没有。结果依赖阈值和检查的时间窗口。'},
  'guidance': {title:'Guidance · 强化条件带来的影响',body:'生成时分别计算带耳语标签和去掉标签的预测，把“加标签后变化的那部分”再强调。它改变下一步语音码的选择倾向，而不是把输出音量调低。强化过度也可能伤害音色与质量。'},
  'hidden-state': {title:'隐状态 · 模型计算中的中间表示',body:'文字、参考声音和生成历史经过一层层计算，形成一组数值向量。它们包含预测下一步需要的信息。比较有无情感标签时的向量变化，可以提取一个与该条件相关的方向。'},
  'norm': {title:'激活范数 · 中间向量的长度',body:'把隐状态看成一个多维向量，范数就是它的整体长度。加入情感方向后重新缩放到原长度，意图在改变方向时控制总体数值规模。保持长度并不保证音色或音质一定不变。'},
  'emoruler': {title:'EmoRuler · 情感分类评分器',body:'一个经过微调的 emotion2vec 家族分类器。此处“命中”表示它预测概率最高的类别恰好是要求的情感。高命中率不直接代表更自然、更强烈或更好听。部分评测音色出现在其训练数据中。'},
  'e2v': {title:'E2V · 公开的 emotion2vec+',body:'使用公开 emotion2vec+ 模型提供另一组情感分类结果。它与 EmoRuler 属于同一预训练模型家族，因此可以交叉参考，但不能当成完全独立的人工判断。这里报告分类命中率。'},
  'cer': {title:'CER · 字符错误率',body:'先将生成语音自动转写，再计算相对于目标文字，需要增加、删除或替换多少字符。越低通常说明内容越准确。它也受语音识别器和文字规范化方式影响，不能反映情感是否自然。'},
  'sim': {title:'SIM · 参考与生成的音色相似度',body:'用说话人识别模型把两段录音变成向量，再比较它们的相似程度。分数越高通常越像同一个声音；情感、耳语等发声变化也可能使分数下降。它不是人的主观音色相似评分。'},
  'utmos': {title:'UTMOS · 自动预测的质量分数',body:'用模型预测语音的感知质量，用于快速筛查候选。虽然数字形式像 MOS，它不是听众实际打出的平均分，也可能对笑声、耳语等特殊发声产生偏差。'},
  'mos': {title:'MOS · 听众评分的平均值',body:'请多人按明确问题对音频打分，再计算平均值。自然度、情感贴合度、音色相似度应分别询问，避免混成一个模糊总分。本篇还没有报告完成的人工听测结果。'},
  'development': {title:'开发面板 · 用于反复比较与选模型',body:'一组固定的请求，便于追踪改动是否有效。因为开发者反复查看这些分数、据此挑选模型，它已经参与研发决策。最终泛化能力仍需要新的、独立的测试数据来检验。'}
};

const termPopup = document.createElement('aside');
termPopup.id = 'term-explanation';
termPopup.className = 'term-popup';
termPopup.setAttribute('role','tooltip');
termPopup.hidden = true;
termPopup.innerHTML = '<strong></strong><p></p>';
document.body.append(termPopup);
let currentTerm = null, termPinned = false, termHideTimer;
function positionTermPopup() {
  if (!currentTerm) return;
  const box = currentTerm.getBoundingClientRect();
  const popup = termPopup.getBoundingClientRect();
  const left = Math.max(12, Math.min(box.left + box.width / 2 - popup.width / 2, innerWidth - popup.width - 12));
  const below = box.bottom + popup.height + 14 < innerHeight;
  const top = Math.max(12, below ? box.bottom + 10 : box.top - popup.height - 10);
  termPopup.style.left = left + 'px';
  termPopup.style.top = top + 'px';
  termPopup.dataset.position = below ? 'below' : 'above';
}
function showTerm(button, pinned = false) {
  const entry = window.IrohaI18n?.glossary(button.dataset.term) || glossary[button.dataset.term];
  if (!entry) return;
  clearTimeout(termHideTimer);
  if (currentTerm && currentTerm !== button) currentTerm.removeAttribute('aria-describedby');
  currentTerm = button; termPinned = pinned;
  termPopup.querySelector('strong').textContent = entry.title;
  termPopup.querySelector('p').textContent = entry.body;
  termPopup.hidden = false;
  button.setAttribute('aria-describedby', termPopup.id);
  positionTermPopup();
}
function hideTerm() {
  clearTimeout(termHideTimer);
  currentTerm?.removeAttribute('aria-describedby');
  currentTerm = null;termPinned = false;termPopup.hidden = true;
}
function scheduleTermHide() {
  if (termPinned) return;
  clearTimeout(termHideTimer);
  termHideTimer = setTimeout(hideTerm, 180);
}
function bindTerms() { document.querySelectorAll('[data-term]').forEach(button => {
  if (button.dataset.termBound) return;
  button.dataset.termBound = 'true';
  button.type = 'button';
  button.addEventListener('pointerenter', e => {
    if (e.pointerType === 'touch') return;
    if (termPinned) return;
    showTerm(button);
  });
  button.addEventListener('pointerleave', scheduleTermHide);
  button.addEventListener('focus', () => showTerm(button));
  button.addEventListener('blur', scheduleTermHide);
  button.addEventListener('click', e => {
    e.stopPropagation();
    if (currentTerm === button && termPinned) hideTerm();
    else showTerm(button, true);
  });
}); }
bindTerms();
window.addEventListener('iroha:languagechange', () => { hideTerm(); bindTerms(); });
termPopup.addEventListener('pointerenter',()=>clearTimeout(termHideTimer));
termPopup.addEventListener('pointerleave',scheduleTermHide);
document.addEventListener('click',e=>{if(!termPopup.contains(e.target))hideTerm();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideTerm();});
window.addEventListener('resize',hideTerm);
window.addEventListener('scroll',()=>{
  if (!currentTerm) return;
  const rect = currentTerm.getBoundingClientRect();
  if (rect.bottom < 72 || rect.top > innerHeight) hideTerm();
  else positionTermPopup();
},{passive:true});
