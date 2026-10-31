import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput, ScrollView, Alert, Platform, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CATEGORIES, RECIPES } from './data';
import { useStore } from './store';

const ORANGE = '#e8590c';
const DIFFICULTIES = ['Легко', 'Средне', 'Сложно'];

// Alert.alert не работает в веб-превью Snack, поэтому на web используем браузерные диалоги.
function showAlert(title, message, buttons) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  const text = message ? `${title}\n\n${message}` : title;
  if (!buttons) {
    window.alert(text);
    return;
  }
  const confirmButton = buttons.find((b) => b.style === 'destructive') || buttons[buttons.length - 1];
  if (window.confirm(text)) confirmButton?.onPress?.();
}

// Кнопка «Назад» есть на КАЖДОМ экране (рубрика 12).
function BackBar({ navigation, title, onFallback }) {
  const press = () => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (onFallback) {
      onFallback();
    } else if (navigation.navigate) {
      navigation.navigate('Главная');
    }
  };
  return (
    <View style={s.topbar}>
      <TouchableOpacity style={s.backBtn} onPress={press} accessibilityRole="button" accessibilityLabel="Назад">
        <Text style={s.backTxt}>← Назад</Text>
      </TouchableOpacity>
      {title ? <Text style={s.topTitle} numberOfLines={1}>{title}</Text> : null}
    </View>
  );
}

function Heart({ id }) {
  const { state, dispatch } = useStore();
  const on = state.favs.includes(id);
  return (
    <TouchableOpacity onPress={() => dispatch({ type: 'TOGGLE_FAV', id })} accessibilityLabel="Избранное">
      <Text style={{ fontSize: 26 }}>{on ? '❤️' : '🤍'}</Text>
    </TouchableOpacity>
  );
}

function Thumb({ item, size = 64 }) {
  return item.image
    ? <Image source={{ uri: item.image }} style={{ width: size, height: size, borderRadius: 12 }} />
    : <View style={[s.thumb, { width: size, height: size }]}><Text style={{ fontSize: size / 2 }}>{item.emoji}</Text></View>;
}

function Card({ item, onPress }) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress}>
      <Thumb item={item} />
      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Text style={s.title}>{item.title}</Text>
        <Text style={s.muted}>{item.category} · {item.time}</Text>
      </View>
      <Heart id={item.id} />
    </TouchableOpacity>
  );
}

export function HomeScreen({ navigation }) {
  const [cat, setCat] = useState('Все');
  const { state } = useStore();
  const all = [...RECIPES, ...state.mine];
  const list = cat === 'Все' ? all : all.filter((r) => r.category === cat);
  return (
    <View style={s.screen}>
      <BackBar navigation={navigation} onFallback={() => setCat('Все')} />
      <Text style={s.h1}>Foodie 🍴</Text>
      <View style={{ height: 52 }}>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={CATEGORIES} keyExtractor={(c) => c}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setCat(item)} style={[s.chip, cat === item && s.chipOn]}>
              <Text style={[s.chipText, cat === item && { color: '#fff' }]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <FlatList
        data={list} keyExtractor={(r) => r.id}
        renderItem={({ item }) => <Card item={item} onPress={() => navigation.navigate('Detail', { id: item.id })} />}
        ListEmptyComponent={<Text style={s.muted}>В этой категории пока нет рецептов</Text>}
      />
    </View>
  );
}

export function FavoritesScreen({ navigation }) {
  const { state } = useStore();
  const list = [...RECIPES, ...state.mine].filter((r) => state.favs.includes(r.id));
  return (
    <View style={s.screen}>
      <BackBar navigation={navigation} title="Избранное" />
      <Text style={s.h1}>Избранное</Text>
      <FlatList
        data={list} keyExtractor={(r) => r.id}
        renderItem={({ item }) => <Card item={item} onPress={() => navigation.navigate('Detail', { id: item.id })} />}
        ListEmptyComponent={<Text style={s.muted}>Нажмите 🤍 на рецепте, чтобы добавить его сюда</Text>}
      />
    </View>
  );
}

export function MyFoodScreen({ navigation }) {
  const { state } = useStore();
  return (
    <View style={s.screen}>
      <BackBar navigation={navigation} title="Моя еда" />
      <Text style={s.h1}>Моя еда</Text>
      <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Form', {})}>
        <Text style={s.btnText}>＋ Добавить новый рецепт</Text>
      </TouchableOpacity>
      <Text style={s.h2}>Мои рецепты</Text>
      <FlatList
        data={state.mine} keyExtractor={(r) => r.id}
        renderItem={({ item }) => <Card item={item} onPress={() => navigation.navigate('Detail', { id: item.id })} />}
        ListEmptyComponent={<Text style={s.muted}>У вас пока нет своих рецептов</Text>}
      />
    </View>
  );
}

export function DetailScreen({ route, navigation }) {
  const { state, dispatch } = useStore();
  const item = [...RECIPES, ...state.mine].find((r) => r.id === route.params.id);
  if (!item) return (
    <View style={s.screen}>
      <BackBar navigation={navigation} title="Рецепт" />
      <Text style={s.h1}>Рецепт не найден</Text>
      <TouchableOpacity style={s.btn} onPress={() => navigation.goBack()}><Text style={s.btnText}>← Назад</Text></TouchableOpacity>
    </View>
  );
  const mine = state.mine.some((m) => m.id === item.id);
  const del = () => showAlert('Удалить рецепт?', item.title, [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Удалить', style: 'destructive', onPress: () => { dispatch({ type: 'DELETE', id: item.id }); navigation.goBack(); } },
  ]);
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <BackBar navigation={navigation} title="Рецепт" />
      <View style={{ alignItems: 'center', marginVertical: 8 }}><Thumb item={item} size={160} /></View>
      <View style={s.row}><Text style={[s.h1, { flex: 1 }]}>{item.title}</Text><Heart id={item.id} /></View>
      <View style={s.info}>
        <Text style={s.infoTxt}>📂 Категория: {item.category}</Text>
        <Text style={s.infoTxt}>⏱ Время приготовления: {item.time}</Text>
        <Text style={s.infoTxt}>🍽 Количество порций: {item.servings}</Text>
        <Text style={s.infoTxt}>🔥 Калории: {item.calories}</Text>
        <Text style={s.infoTxt}>📊 Уровень сложности: {item.difficulty}</Text>
      </View>
      <Text style={s.h2}>Ингредиенты</Text>
      {item.ingredients.map((x, i) => <Text key={i} style={s.line}>• {x}</Text>)}
      <Text style={s.h2}>Пошаговые инструкции</Text>
      {item.instructions.map((x, i) => <Text key={i} style={s.line}>{i + 1}. {x}</Text>)}
      {mine && (
        <View style={[s.row, { marginTop: 20 }]}>
          <TouchableOpacity style={[s.btn, { flex: 1, marginRight: 8 }]} onPress={() => navigation.navigate('Form', { id: item.id })}>
            <Text style={s.btnText}>Редактировать</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: '#c92a2a' }]} onPress={del}>
            <Text style={s.btnText}>Удалить</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function Chips({ data, value, onChange }) {
  return (
    <View style={s.wrap}>
      {data.map((c) => (
        <TouchableOpacity key={c} onPress={() => onChange(c)} style={[s.chip, value === c && s.chipOn]}>
          <Text style={[s.chipText, value === c && { color: '#fff' }]}>{c}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function FormScreen({ route, navigation }) {
  const { state, dispatch } = useStore();
  const old = state.mine.find((m) => m.id === route.params?.id);
  const [title, setTitle] = useState(old?.title || '');
  const [image, setImage] = useState(old?.image || null);
  const [category, setCategory] = useState(old?.category || 'Мои');
  const [time, setTime] = useState(old?.time || '20 мин');
  const [servings, setServings] = useState(old?.servings || '2');
  const [calories, setCalories] = useState(old?.calories || '250 ккал');
  const [difficulty, setDifficulty] = useState(old?.difficulty || 'Легко');
  const [ing, setIng] = useState(old?.ingredients.join('\n') || '');
  const [steps, setSteps] = useState(old?.instructions.join('\n') || '');

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
    if (!res.canceled) setImage(res.assets[0].uri);
  };
  const lines = (t) => t.split('\n').map((x) => x.trim()).filter(Boolean);
  const save = () => {
    if (!title.trim() || !lines(ing).length || !lines(steps).length)
      return showAlert('Заполните название, ингредиенты и инструкции');
    dispatch({ type: 'SAVE', recipe: {
      id: old?.id || String(Date.now()), title: title.trim(), image, emoji: '🍽️', category,
      ingredients: lines(ing), instructions: lines(steps),
      time: time.trim() || 'Не указано', servings: servings.trim() || 'Не указано',
      calories: calories.trim() || 'Не указано', difficulty,
    } });
    navigation.goBack();
  };
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <BackBar navigation={navigation} title={old ? 'Редактирование' : 'Новый рецепт'} />
      <Text style={s.h1}>{old ? 'Редактировать рецепт' : 'Новый рецепт'}</Text>
      <Text style={s.h2}>Название рецепта</Text>
      <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Например, Борщ" />
      <Text style={s.h2}>Изображение</Text>
      {image && <Image source={{ uri: image }} style={s.preview} />}
      <TouchableOpacity style={[s.btn, { backgroundColor: '#495057' }]} onPress={pick}>
        <Text style={s.btnText}>{image ? 'Изменить изображение' : 'Загрузить изображение'}</Text>
      </TouchableOpacity>
      <Text style={s.h2}>Категория</Text>
      <Chips data={CATEGORIES.filter((c) => c !== 'Все')} value={category} onChange={setCategory} />
      <View style={s.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={s.h2}>Время приготовления</Text>
          <TextInput style={s.input} value={time} onChangeText={setTime} placeholder="30 мин" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.h2}>Количество порций</Text>
          <TextInput style={s.input} value={servings} onChangeText={setServings} placeholder="4" keyboardType="numeric" />
        </View>
      </View>
      <Text style={s.h2}>Калории</Text>
      <TextInput style={s.input} value={calories} onChangeText={setCalories} placeholder="350 ккал" />
      <Text style={s.h2}>Уровень сложности</Text>
      <Chips data={DIFFICULTIES} value={difficulty} onChange={setDifficulty} />
      <Text style={s.h2}>Список ингредиентов (по одному в строке)</Text>
      <TextInput style={[s.input, s.multi]} value={ing} onChangeText={setIng} multiline />
      <Text style={s.h2}>Пошаговые инструкции (один шаг в строке)</Text>
      <TextInput style={[s.input, s.multi]} value={steps} onChangeText={setSteps} multiline />
      <TouchableOpacity style={[s.btn, { marginTop: 20 }]} onPress={save}>
        <Text style={s.btnText}>Сохранить рецепт</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff8f0', padding: 16 },
  topbar: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backBtn: { backgroundColor: '#ffe8cc', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  backTxt: { color: ORANGE, fontWeight: '800', fontSize: 15 },
  topTitle: { marginLeft: 10, color: '#868e96', fontWeight: '600', fontSize: 15, flex: 1 },
  h1: { fontSize: 26, fontWeight: '800', color: '#3b2a1a', marginTop: 8, marginBottom: 8 },
  h2: { fontSize: 17, fontWeight: '700', color: '#3b2a1a', marginTop: 16, marginBottom: 6 },
  title: { fontSize: 16, fontWeight: '700', color: '#3b2a1a' },
  muted: { color: '#868e96', marginTop: 4 },
  line: { fontSize: 15, color: '#343a40', marginVertical: 3 },
  row: { flexDirection: 'row', alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 10, marginVertical: 5, elevation: 2 },
  thumb: { backgroundColor: '#ffe8cc', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 14, height: 36, borderRadius: 18, backgroundColor: '#ffe8cc', justifyContent: 'center', marginRight: 8, marginBottom: 8 },
  chipOn: { backgroundColor: ORANGE },
  chipText: { color: '#5c3d1e', fontWeight: '600', fontSize: 14 },
  btn: { backgroundColor: ORANGE, padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  info: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 8 },
  infoTxt: { fontSize: 15, marginVertical: 2, color: '#343a40' },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#dee2e6' },
  multi: { minHeight: 110, textAlignVertical: 'top' },
  preview: { width: '100%', height: 180, borderRadius: 12, marginBottom: 8 },
});
