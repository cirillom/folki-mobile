import React, { useState } from "react";
import * as Notifications from "expo-notifications";
import { useNavigation } from "@react-navigation/native";
import DefaultBackground from "../../components/DefaultBackground";
import ButtonsNavigation from "../../components/ButtonsNavigation";
import { ScrollView } from "react-native";
import Card from "../../components/Card";
import Title from "../../components/Title";
import Paragraph from "../../components/Paragraph";
import Button from "../../components/Button";
import { useUser } from "../../contexts/UserContext";
import getGradingPercentage from "../../utils/getGradingPercentage";
import getActivityDate from "../../utils/getActivityDate";
import getActivityColorByType from "../../utils/getActivityColorByType";
import verifyIfIsActivityFinished from "../../utils/verifyIfIsActivityFinished";
import theme from "../../config/theme";
import apiClient from "../../clients/apiClient";
import Activity from "../../types/Activity";
import CalendarModal from "../../components/CalendarModel";
import FloatRight from "./components/FloatRight";
import { DateData } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Activities = () => {
  const { userActivities, token, setUserActivities } = useUser();
  const navigation = useNavigation();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleNewActivityPress = () => {
    // @ts-ignore
    navigation.navigate("CreateActivity");
  };

  const getRemainingActivities = () => {
    return userActivities.filter(
      (activity) => !verifyIfIsActivityFinished(activity.finishDate)
    );
  };

  const removeFromUserActivities = (activity: Activity) => {
    setUserActivities(userActivities.filter((act) => act.id !== activity.id));
  };

  const removeActivityNotification = async (activity: Activity) => {
    const notificationIdentifier = await AsyncStorage.getItem(
      `activity-notification-${activity.id}`
    );
    if (notificationIdentifier) {
      await Notifications.cancelScheduledNotificationAsync(
        notificationIdentifier
      );
      await AsyncStorage.removeItem(`activity-notification-${activity.id}`);
    }
  };

  const onRemoveActivityPress = async (activity: Activity) => {
    removeFromUserActivities(activity);
    try {
      await apiClient.removeActivity(activity.id.toString(), token!);
      await removeActivityNotification(activity);
    } catch (error: any) {
      console.error(error);
    }
  };

  const onUpdateActivityPress = (activity: Activity) => {
    // @ts-ignore
    navigation.navigate("CreateActivity", {
      activity,
    });
  };

  const onDayPress = (date: DateData) => {
    console.log(date);
    // @ts-ignore
    navigation.navigate("ActivitiesDate", {
      activityDate: date,
    });
  };

  const check = async (activity: Activity) => {
    const newActivity = { ...activity, checked: true };
    const newActivities = userActivities.map((act) =>
      act.id === activity.id ? newActivity : act
    );
    setUserActivities(newActivities);

    try {
      await apiClient.checkActivity(activity.id.toString(), token!);
    } catch (error: any) {
      console.error(error);
    }
  };

  const uncheck = async (activity: Activity) => {
    const newActivity = { ...activity, checked: false };
    const newActivities = userActivities.map((act) =>
      act.id === activity.id ? newActivity : act
    );
    setUserActivities(newActivities);

    try {
      await apiClient.uncheckActivity(activity.id.toString(), token!);
    } catch (error: any) {
      console.error(error);
    }
  };

  const remainingActivitiesNumber = getRemainingActivities().length;

  return (
    <DefaultBackground>
      <Title>Atividades</Title>
      <Paragraph>
        {remainingActivitiesNumber} Atividade
        {remainingActivitiesNumber !== 1 ? "s" : ""} Restante
        {remainingActivitiesNumber !== 1 ? "s" : ""}!
      </Paragraph>
      <ScrollView contentContainerStyle={{ gap: 8 }}>
        <Button text="Adicionar Atividade" onPress={handleNewActivityPress} />
        {userActivities
          .sort((a, b) => {

            // Then, sort by checked status, unchecked items first
            if (a.checked !== b.checked) {
              return a.checked ? 1 : -1;
            }
                    
            const today = new Date().setHours(0, 0, 0, 0);
        
            // First, sort by finish date, placing past dates at the bottom
            const dateA = new Date(a.finishDate).setHours(0, 0, 0, 0);
            const dateB = new Date(b.finishDate).setHours(0, 0, 0, 0);
        
            if (dateA !== dateB) {
              // Activities in the future or today come first, past activities come last
              if (dateA >= today && dateB >= today) {
                return dateA - dateB; // Future or today, sort ascending by date
              }
              return dateA < today ? 1 : -1; // Past dates to the bottom
            }

            return 0; // If both date and checked status are the same, keep original order
          })
        .map((activity, index) => (
          <Card
            key={`activity-${activity.id}`}
            title={activity.name}
            color={
              verifyIfIsActivityFinished(activity.finishDate)
                ? activity.checked
                  ? theme.colors.gray.gray2
                  : theme.colors.red.red1
                : activity.checked
                  ? theme.colors.gray.gray4
                  : getActivityColorByType(activity.type)
            }
            middleLeftIcons={[
              activity.checked ? "checkbox-outline" : "square-outline",
            ]}
            middleLeftIconsOnPress={[
              activity.checked 
                ? () => uncheck(activity) 
                : () => check(activity),
            ]}
            topRightIcons={[
              "pencil",
              "trash",
            ]}
            topRightIconsOnPress={[
              activity.checked
                ? () => uncheck(activity)
                : () => check(activity),
              () => onUpdateActivityPress(activity),
              () => onRemoveActivityPress(activity),
            ]}
            lines={[
              activity.subjectClass!.subject.name!,
              `${getGradingPercentage(
                activity.value
              )}% da Nota - ${getActivityDate(activity.finishDate)}`,
            ]}
          />
        ))}
      </ScrollView>
      <FloatRight
        onPress={() => setIsCalendarOpen(!isCalendarOpen)}
        isCalendarOpen={isCalendarOpen}
      />
      <ButtonsNavigation />
      {isCalendarOpen && <CalendarModal onDayPress={onDayPress} />}
    </DefaultBackground>
  );
};

export default Activities;
