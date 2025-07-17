// 测试复习逻辑
const testReviewLogic = () => {
  const REVIEW_INTERVALS = [2, 4, 8, 15];
  
  console.log('复习间隔测试：');
  console.log('如果今天是第1天首播：');
  
  let currentDate = new Date('2025-01-01'); // 假设首播日期
  console.log(`首播日期: ${currentDate.toDateString()}`);
  
  for (let i = 0; i < REVIEW_INTERVALS.length; i++) {
    const nextReviewDate = new Date(currentDate);
    nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS[i]);
    console.log(`第${i + 1}次复习: ${nextReviewDate.toDateString()} (间隔${REVIEW_INTERVALS[i]}天)`);
    currentDate = nextReviewDate;
  }
  
  console.log('\n实际复习时间线：');
  console.log('第1天: 首播');
  console.log('第3天: 第1次复习 (间隔2天)');
  console.log('第7天: 第2次复习 (间隔4天)');
  console.log('第15天: 第3次复习 (间隔8天)');
  console.log('第30天: 第4次复习 (间隔15天)');
  console.log('第5次复习后: 标记为完成');
};

// 运行测试
testReviewLogic();
