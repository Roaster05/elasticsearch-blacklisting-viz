export function getHealth(totalCount) {
  let healthStatus;
  if (totalCount >= 20) {
    healthStatus = "Red";
  } else if (totalCount >= 10) {
    healthStatus = "Yellow";
  } else {
    healthStatus = "Green";
  }
  return healthStatus;
}
