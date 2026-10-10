<template>
  <div>
    <header class="page-header">
      <h2 class="page-title">📖 使用教程</h2>
      <p class="page-subtitle">快速上手 osu!Finder 的基本功能</p>
    </header>

    <div class="tutorial-grid">
      <section class="tutorial-card">
        <div class="tutorial-header">
          <div class="tutorial-step">1</div>
          <div>
            <h3>🔍 搜索玩家</h3>
            <p class="muted">通过 osu! UID、昵称、联系方式或事迹内容快速查找</p>
          </div>
        </div>
        <ul class="tutorial-list">
          <li>在侧边栏点击 <b>搜索玩家</b> 进入搜索页</li>
          <li>输入 osu! UID、昵称、QQ、B站、Discord、Twitter 或事迹内容进行模糊搜索</li>
          <li>支持按 UID 升序/降序、名称字母排序</li>
          <li>卡片中可预览头像、常用昵称、事迹等级标签和联系方式</li>
          <li>点击卡片进入该玩家的详细页面</li>
        </ul>
      </section>

      <section class="tutorial-card">
        <div class="tutorial-header">
          <div class="tutorial-step">2</div>
          <div>
            <h3>➕ 添加玩家</h3>
            <p class="muted">新建一位玩家的档案</p>
          </div>
        </div>
        <ul class="tutorial-list">
          <li>在侧边栏点击 <b>添加玩家</b></li>
          <li>填写 <b>osu! UID</b>（必填，用于唯一标识玩家）</li>
          <li>填写昵称（可添加多个曾用名/别名）</li>
          <li>填写联系方式（QQ、B站、Discord、Twitter，每种均可添加多个）</li>
          <li>在事迹区添加记录，按程度选择 <span class="badge badge--green">绿色</span>、<span class="badge badge--yellow">黄色</span> 或 <span class="badge badge--red">红色</span></li>
          <li>事迹支持自定义文本描述，方便记录具体事件</li>
        </ul>
      </section>

      <section class="tutorial-card">
        <div class="tutorial-header">
          <div class="tutorial-step">3</div>
          <div>
            <h3>👤 编辑与查看详情</h3>
            <p class="muted">查看玩家完整信息，修改、删除或新增事迹</p>
          </div>
        </div>
        <ul class="tutorial-list">
          <li>搜索结果中点击任意玩家进入详情页</li>
          <li>详情页展示头像、全部昵称、联系方式、事迹等级和该玩家参与的赛事</li>
          <li>点击 <b>编辑</b> 按钮可修改昵称、联系方式和事迹</li>
          <li>事迹按颜色分级：<span class="badge badge--green">绿色</span>公开/一般，<span class="badge badge--yellow">黄色</span>较严重，<span class="badge badge--red">红色</span>需警惕</li>
          <li>编辑后点击 <b>保存</b> 提交，或点击 <b>取消</b> 放弃修改</li>
          <li>页面底部可 <b>删除该玩家</b>（操作不可撤销，请谨慎）</li>
        </ul>
      </section>

      <section class="tutorial-card">
        <div class="tutorial-header">
          <div class="tutorial-step">4</div>
          <div>
            <h3>🏆 赛事管理</h3>
            <p class="muted">创建赛事、管理队伍、设置名次</p>
          </div>
        </div>
        <ul class="tutorial-list">
          <li>在侧边栏点击 <b>赛事记录</b> 进入赛事大厅</li>
          <li>大厅卡片展示赛事名称、届次标签和前三名队伍</li>
          <li>搜索框支持按赛事名称、届次、队伍名、队员 UID 搜索</li>
        </ul>
        <div class="tutorial-subsection">
          <h4>创建赛事</h4>
          <ul class="tutorial-list">
            <li>点击 <b>+ 新建</b> 进入赛事编辑页</li>
            <li>填写 <b>赛事名称</b>（必填）和 <b>届次</b>（如 S24、第3届）</li>
            <li><b>规模设置</b>：队伍人数 (ts) 和上场人数 (ms)，如 6v4 赛制</li>
            <li><b>名次设置</b>：使用默认名次区间（#1, #2, #3~#4, #5~#8, #9~#16）或自定义添加/删除区间</li>
          </ul>
        </div>
        <div class="tutorial-subsection">
          <h4>队伍管理</h4>
          <ul class="tutorial-list">
            <li>点击 <b>+ 添加队伍</b> 创建新队伍</li>
            <li>填写队伍名称，通过搜索框添加已有玩家作为队员（需先在玩家库中创建）</li>
            <li>每个队伍可分配名次，点击名次下拉选择对应排位</li>
            <li>冠军、亚军、季军自动应用金/银/铜渐变色标识</li>
            <li>点击比赛卡片进入详情页，按名次排序展示所有队伍及队员</li>
          </ul>
        </div>
      </section>

      <section class="tutorial-card">
        <div class="tutorial-header">
          <div class="tutorial-step">5</div>
          <div>
            <h3>💾 数据导入与导出</h3>
            <p class="muted">在不同设备之间同步或备份你的数据</p>
          </div>
        </div>
        <ul class="tutorial-list">
          <li>进入 <b>设置</b> 页面，看到当前玩家数量、事迹数量和存储空间占用</li>
          <li><b>导出数据</b>：按等级选择导出范围
            <ul>
              <li><span class="badge badge--green">绿色</span> 只导出公开程度的事迹</li>
              <li><span class="badge badge--yellow">黄色以内</span> 导出绿色 + 黄色</li>
              <li><span class="badge badge--red">所有</span> 导出全部事迹</li>
            </ul>
          </li>
          <li><b>导入数据</b>：选择之前导出的 JSON 文件，已有玩家会智能合并（昵称去重、事迹不重复添加）</li>
          <li>所有数据仅保存在浏览器本地 IndexedDB 中，不会上传到任何服务器</li>
          <li>建议定期导出 JSON 文件作为备份，避免浏览器数据清理导致丢失</li>
        </ul>
      </section>

      <section class="tutorial-card">
        <div class="tutorial-header">
          <div class="tutorial-step">6</div>
          <div>
            <h3>🎨 主题切换与界面</h3>
            <p class="muted">浅色 / 深色外观，响应式布局</p>
          </div>
        </div>
        <ul class="tutorial-list">
          <li>侧边栏底部点击 <b>深色 / 浅色</b> 按钮快速切换主题</li>
          <li>也可在 <b>设置</b> 页面的「主题」中选择</li>
          <li>主题偏好自动保存，下次打开自动应用</li>
          <li>界面采用响应式设计，适配不同屏幕尺寸</li>
        </ul>
      </section>

      <section class="tutorial-card">
        <div class="tutorial-header">
          <div class="tutorial-step">7</div>
          <div>
            <h3>⚠️ 注意事项</h3>
            <p class="muted">数据安全与使用提示</p>
          </div>
        </div>
        <ul class="tutorial-list">
          <li>应用为 <b>纯前端离线</b> 架构，无后端服务器，数据仅存于浏览器</li>
          <li>清空浏览器数据（缓存/Cookie/存储）会导致数据永久丢失</li>
          <li><b>清空所有玩家</b> 操作不可撤销，请先导出备份</li>
          <li>赛事数据中的队员是通过 osu! UID 关联已有玩家，队员需先在玩家库中创建</li>
          <li>导入玩家时会保留原有事迹和联系方式，不会覆盖已有数据</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.tutorial-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tutorial-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 20px;
}

.tutorial-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 14px;
}

.tutorial-step {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--btn-primary-start) 0%, var(--btn-primary-end) 100%);
  color: var(--text-on-primary);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-base);
}

.tutorial-header h3 {
  margin: 0 0 4px 0;
  font-size: var(--font-size-lg);
  color: var(--text-primary);
}

.tutorial-list {
  margin: 0;
  padding-left: 22px;
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  line-height: 1.7;
}

.tutorial-list li {
  margin-bottom: 4px;
}

.tutorial-subsection {
  margin-top: 10px;
  margin-left: 8px;
  padding-left: 12px;
  border-left: 2px solid var(--border-divider);
}

.tutorial-subsection h4 {
  margin: 0 0 6px 0;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: #fff;
}

.badge--green { background: var(--color-level-green); }
.badge--yellow { background: var(--color-level-yellow); }
.badge--red { background: var(--color-level-red); }
</style>